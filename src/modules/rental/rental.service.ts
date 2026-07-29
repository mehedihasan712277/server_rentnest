import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import {
    SubscriptionStatus,
    PaymentStatus,
    RentalRequestStatus,
} from "../../../generated/prisma/enums";

const toDate = (unixSeconds: number) => new Date(unixSeconds * 1000);

/**
 * As of the Stripe "Basil" API version (2025-03-31), current_period_start
 * and current_period_end were removed from the Subscription object and
 * moved down to the subscription item level, since a subscription can now
 * have items on different billing cycles. We only ever put one price on a
 * subscription (one property = one item), so items.data[0] is always the
 * right one here.
 */
const getSubscriptionPeriod = (subscription: Stripe.Subscription) => {
    const item = subscription.items.data[0];
    if (!item) {
        throw new Error(
            `Subscription ${subscription.id} has no items - cannot determine billing period`,
        );
    }
    return {
        start: toDate(item.current_period_start),
        end: toDate(item.current_period_end),
    };
};

/**
 * As of Basil, Invoice.subscription was removed. The subscription is now
 * nested under invoice.parent (only when parent.type is
 * "subscription_details" - invoices can also be one-off, unrelated to any
 * subscription).
 */
const getSubscriptionIdFromInvoice = (
    invoice: Stripe.Invoice,
): string | null => {
    if (invoice.parent?.type !== "subscription_details") return null;

    const subscription = invoice.parent.subscription_details?.subscription;
    if (typeof subscription === "string") return subscription;
    if (subscription && typeof subscription === "object")
        return subscription.id;
    return null;
};

/**
 * Idempotent AND race-safe: safe to call from multiple webhook events, safe
 * if Stripe retries/redelivers the same event, and safe if
 * checkout.session.completed and invoice.paid arrive close enough together
 * to be processed concurrently (which happens - Stripe fires them roughly
 * 1 second apart for the first billing cycle).
 *
 * Uses subscription.metadata.rentalRequestId (set in checkout.sessions.create's
 * subscription_data.metadata) to find who/what this subscription is for,
 * so this works even if invoice.paid arrives before checkout.session.completed.
 */
const ensureRentalForSubscription = async (subscriptionId: string) => {
    const existing = await prisma.rental.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
    });
    if (existing) return existing;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const rentalRequestId = subscription.metadata?.rentalRequestId;

    if (!rentalRequestId) {
        // Not one of our rental subscriptions (or metadata missing) - nothing to do.
        return null;
    }

    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id: rentalRequestId },
    });
    if (!rentalRequest) return null;

    const period = getSubscriptionPeriod(subscription);

    let rental;
    try {
        rental = await prisma.rental.create({
            data: {
                tenantId: rentalRequest.tenantId,
                propertyId: rentalRequest.propertyId,
                startDate: period.start,
                status: SubscriptionStatus.ACTIVE,
                stripeSubscriptionId: subscription.id,
                currentPeriodStart: period.start,
                currentPeriodEnd: period.end,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
    } catch (err) {
        // checkout.session.completed and invoice.paid can be processed
        // concurrently. If both passed the findUnique check above before
        // either had created the row, the second create() here hits a
        // unique constraint violation (P2002) on stripeSubscriptionId.
        // That's fine - the other request already created it; just fetch it.
        const isUniqueConstraintError =
            err !== null &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code?: string }).code === "P2002";

        if (isUniqueConstraintError) {
            const rentalFromRace = await prisma.rental.findUnique({
                where: { stripeSubscriptionId: subscriptionId },
            });
            if (rentalFromRace) return rentalFromRace;
        }

        throw err;
    }

    // One active rental should block other tenants from applying/paying for the same property.
    await prisma.property.update({
        where: { id: rentalRequest.propertyId },
        data: { status: "NOTAVAILABLE" },
    });

    if (rentalRequest.status !== RentalRequestStatus.COMPLETED) {
        await prisma.rentalRequest.update({
            where: { id: rentalRequestId },
            data: {
                status: RentalRequestStatus.COMPLETED,
                stripeSubscriptionId: subscription.id,
            },
        });
    }

    return rental;
};

/**
 * Handles invoice.paid - both the very first invoice and every renewal.
 * Refreshes the billing period on Rental and records a Payment row.
 * Upserts on stripeInvoiceId so Stripe redelivering the same webhook
 * event doesn't create duplicate Payment rows.
 */
const recordSuccessfulInvoicePayment = async (invoice: Stripe.Invoice) => {
    const subscriptionId = getSubscriptionIdFromInvoice(invoice);
    if (!subscriptionId) return null;

    const rental = await ensureRentalForSubscription(subscriptionId);
    if (!rental) return null;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const period = getSubscriptionPeriod(subscription);

    const updatedRental = await prisma.rental.update({
        where: { id: rental.id },
        data: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });

    // Invoice.payment_intent was removed in the Basil API version. invoice.id
    // is already guaranteed unique by Stripe, so it works fine as the
    // transactionId - if you need the underlying PaymentIntent id later
    // (e.g. for refunds), fetch it separately with
    // stripe.invoices.retrieve(invoice.id, { expand: ["payments.data.payment.payment_intent"] }).
    await prisma.payment.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
            rentalId: updatedRental.id,
            userId: updatedRental.tenantId,
            transactionId: invoice.id as string,
            stripeInvoiceId: invoice.id,
            amount: (invoice.amount_paid ?? 0) / 100,
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
        },
        update: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
        },
    });

    return updatedRental;
};

/**
 * Handles invoice.payment_failed. Stripe will keep retrying the charge
 * automatically for a while before eventually cancelling the subscription
 * (that final step is handled separately by customer.subscription.deleted).
 */
const recordFailedInvoicePayment = async (invoice: Stripe.Invoice) => {
    const subscriptionId = getSubscriptionIdFromInvoice(invoice);
    if (!subscriptionId) return null;

    const rental = await prisma.rental.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
    });
    if (!rental) return null;

    const updatedRental = await prisma.rental.update({
        where: { id: rental.id },
        data: { status: SubscriptionStatus.PAST_DUE },
    });

    await prisma.payment.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
            rentalId: rental.id,
            userId: rental.tenantId,
            transactionId: invoice.id as string,
            stripeInvoiceId: invoice.id,
            amount: (invoice.amount_due ?? 0) / 100,
            status: PaymentStatus.FAILED,
        },
        update: { status: PaymentStatus.FAILED },
    });

    return updatedRental;
};

/**
 * Handles customer.subscription.updated - fires on retries, status
 * transitions (active -> past_due -> unpaid), plan changes, etc.
 * Keeps Rental in sync with whatever Stripe currently reports.
 */
const syncRentalFromSubscription = async (
    subscription: Stripe.Subscription,
) => {
    const rental = await prisma.rental.findUnique({
        where: { stripeSubscriptionId: subscription.id },
    });
    if (!rental) return null;

    let status: SubscriptionStatus = rental.status;
    if (
        subscription.status === "active" ||
        subscription.status === "trialing"
    ) {
        status = SubscriptionStatus.ACTIVE;
    } else if (
        subscription.status === "past_due" ||
        subscription.status === "unpaid"
    ) {
        status = SubscriptionStatus.PAST_DUE;
    } else if (
        subscription.status === "canceled" ||
        subscription.status === "incomplete_expired"
    ) {
        status = SubscriptionStatus.CANCELED;
    }

    const period = getSubscriptionPeriod(subscription);

    return prisma.rental.update({
        where: { id: rental.id },
        data: {
            status,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });
};

/**
 * Handles customer.subscription.deleted - the subscription is fully gone
 * (either the tenant cancelled, or Stripe gave up retrying a failed charge).
 * Frees up the property for other tenants.
 */
const cancelRentalFromSubscription = async (
    subscription: Stripe.Subscription,
) => {
    const rental = await prisma.rental.findUnique({
        where: { stripeSubscriptionId: subscription.id },
    });
    if (!rental) return null;

    const updatedRental = await prisma.rental.update({
        where: { id: rental.id },
        data: {
            status: SubscriptionStatus.CANCELED,
            endDate: new Date(),
        },
    });

    await prisma.property.update({
        where: { id: rental.propertyId },
        data: { status: "AVAILABLE" },
    });

    return updatedRental;
};

/**
 * Use this in your property-access-gating logic instead of checking
 * RentalRequest.status - RentalRequest never changes once COMPLETED, so it
 * goes stale the moment a renewal fails or a subscription is cancelled.
 */
const hasActiveAccess = async (tenantId: string, propertyId: string) => {
    const rental = await prisma.rental.findFirst({
        where: {
            tenantId,
            propertyId,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { gt: new Date() },
        },
    });
    return !!rental;
};

// Tenant: list of properties they're currently paying for / have rented before.
const getMyRentalsFromDB = (tenantId: string) => {
    return prisma.rental.findMany({
        where: { tenantId },
        include: {
            property: {
                select: {
                    title: true,
                    location: true,
                    thumbnail: true,
                    price: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

// Landlord: rentals currently/previously happening on properties they own.
const getMyPropertyRentalsFromDB = (landlordId: string) => {
    return prisma.rental.findMany({
        where: { property: { landlordId } },
        include: {
            tenant: {
                select: { name: true, email: true },
            },
            property: {
                select: { title: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

const getAllRentalInfoForAdmin = async () => {
    const result = await prisma.rental.findMany({
        include: {
            property: {
                select: {
                    title: true,
                    description: true,
                    thumbnail: true,
                    price: true,
                    area: true,
                    landlord: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            tenant: {
                select: {
                    name: true,
                    email: true,
                    profile: true,
                },
            },
        },
    });

    return result;
};

export const rentalServices = {
    ensureRentalForSubscription,
    recordSuccessfulInvoicePayment,
    recordFailedInvoicePayment,
    syncRentalFromSubscription,
    cancelRentalFromSubscription,
    hasActiveAccess,
    getMyRentalsFromDB,
    getMyPropertyRentalsFromDB,
    getAllRentalInfoForAdmin,
};
