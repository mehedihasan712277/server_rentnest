import { Request, Response } from "express";
import Stripe from "stripe";
import config from "../../config";
import { stripe } from "../../lib/stripe";
import { rentalRequestServices } from "../rental_request/rental_request.service";
import { rentalServices } from "../rental/rental.service";

const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
        return res
            .status(400)
            .send("Webhook Error: missing stripe-signature header");
    }

    let event: Stripe.Event;

    try {
        // req.body must be the raw, unparsed request body (Buffer) for
        // signature verification to work - see webhook.routes.ts.
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            config.stripe_webhook_secret as string,
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return res.status(400).send(`Webhook Error: ${message}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const rentalRequestId = session.metadata?.rentalRequestId;

                const subscriptionId =
                    typeof session.subscription === "string"
                        ? session.subscription
                        : session.subscription?.id;

                if (rentalRequestId && subscriptionId) {
                    // Marks the RentalRequest COMPLETED (existing behaviour).
                    await rentalRequestServices.completeRentalRequestById(
                        rentalRequestId,
                        subscriptionId,
                    );

                    // Creates the actual billable Rental row + flips
                    // Property to NOTAVAILABLE. Safe to call even if
                    // invoice.paid already created it (idempotent).
                    await rentalServices.ensureRentalForSubscription(
                        subscriptionId,
                    );
                }
                break;
            }

            case "checkout.session.expired": {
                const session = event.data.object as Stripe.Checkout.Session;
                const rentalRequestId = session.metadata?.rentalRequestId;

                if (rentalRequestId) {
                    // Nothing to do - the rental request just stays APPROVED,
                    // so the user can hit /subscribe again to retry payment.
                    break;
                }
                break;
            }

            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                await rentalServices.recordSuccessfulInvoicePayment(invoice);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                await rentalServices.recordFailedInvoicePayment(invoice);
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                await rentalServices.syncRentalFromSubscription(subscription);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await rentalServices.cancelRentalFromSubscription(subscription);
                break;
            }

            default:
                // Unhandled event types are fine to ignore.
                break;
        }
    } catch (err) {
        // IMPORTANT: still return 200 vs 500 deliberately here. If we
        // returned 500, Stripe would retry this exact event repeatedly.
        // Log it for yourself, but don't let a DB hiccup cause a retry
        // storm. If you'd rather have Stripe retry on failure, change
        // this to res.status(500) - just make sure your handlers above
        // are safe to run twice (they are, since they upsert/idempotency-check).
        console.error(
            "Error processing Stripe webhook event:",
            event.type,
            err,
        );
    }

    res.status(200).json({ received: true });
};

export const webhookController = {
    handleStripeWebhook,
};
