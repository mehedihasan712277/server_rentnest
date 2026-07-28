import { RentalRequestStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IRentalRequestPayload } from "./rental_request.interface";
import config from "../../config";
import { stripe } from "../../lib/stripe";

const createRequestIntoDB = async (payload: IRentalRequestPayload) => {
    const property = await prisma.property.findFirstOrThrow({
        where: {
            id: payload.propertyId,
        },
        include: {
            rentalRequests: {
                select: {
                    tenantId: true,
                },
            },
        },
    });

    if (property.landlordId === payload.tenantId) {
        throw new Error("you cannot request for your own property");
    }

    if (property.status === "NOTAVAILABLE") {
        throw new Error("the property is not available anymore");
    }

    const alreadyRequested = property.rentalRequests.some(
        (request) => request.tenantId === payload.tenantId,
    );

    if (alreadyRequested) {
        throw new Error(
            "You have already submitted a rental request for this property.",
        );
    }

    const result = await prisma.rentalRequest.create({
        data: { ...payload, landlordId: property.landlordId },
    });
    return result;
};

const getAllRequestsFromDB = async () => {
    const result = await prisma.rentalRequest.findMany({
        include: {
            tenant: {
                select: {
                    name: true,
                },
            },
            property: {
                select: {
                    landlord: {
                        select: {
                            name: true,
                        },
                    },
                    title: true,
                    area: true,
                    price: true,
                },
            },
        },
    });
    console.log("result", result);

    return result;
};

const getSingleRequestFromDB = async () => {};

const getMySentRequestFromDB = async (tenantId: string) => {
    const result = await prisma.rentalRequest.findMany({
        where: {
            tenantId,
            status: { in: ["APPROVED", "REJECTED", "PENDING"] },
        },
        include: {
            property: {
                select: {
                    title: true,
                    landlord: {
                        select: {
                            name: true,
                        },
                    },
                    price: true,
                    area: true,
                },
            },
        },
    });

    return result;
};

const getRentalRequestToMyPropertyFromDB = async (landlordId: string) => {
    const result = await prisma.rentalRequest.findMany({
        where: {
            property: {
                landlordId,
            },
            status: {
                notIn: ["REJECTED", "COMPLETED"],
            },
        },
        include: {
            tenant: {
                select: {
                    name: true,
                },
            },
            property: {
                select: {
                    title: true,
                },
            },
        },
    });

    return result;
};

const handleRequestStatusIntoDB = async (
    rentalrequestId: string,
    landlordId: string,
    payload: RentalRequestStatus,
) => {
    const rental_request = await prisma.rentalRequest.findUniqueOrThrow({
        where: {
            id: rentalrequestId,
        },
    });

    if (landlordId !== rental_request.landlordId) {
        throw new Error(
            "You cannot change it as you don't belong the property",
        );
    }

    if (rental_request.status === "APPROVED") {
        throw new Error("already approved");
    }

    if (rental_request.status === "DELETED") {
        throw new Error("You cannot change this, it is deleted");
    }

    if (rental_request.status === "COMPLETED") {
        throw new Error("You cannot change this, it is completed");
    }

    const result = await prisma.rentalRequest.update({
        where: {
            id: rentalrequestId,
        },
        data: {
            status: payload,
        },
    });

    return result;
};

const tenantWithdrawRequestIntoDB = async (
    rentalrequestId: string,
    tenantId: string,
) => {
    const rental_request = await prisma.rentalRequest.findUniqueOrThrow({
        where: {
            id: rentalrequestId,
        },
    });

    if (tenantId !== rental_request.tenantId) {
        throw new Error(
            "You cannot have access to do anything to other tenants' rental request",
        );
    }

    if (
        rental_request.status === "COMPLETED" ||
        rental_request.status === "APPROVED"
    ) {
        throw new Error(
            "You cannot withdraw your requested after beign approved or completed",
        );
    }

    const result = await prisma.rentalRequest.update({
        where: {
            id: rentalrequestId,
        },
        data: {
            status: "DELETED",
        },
    });

    return result;
};

const adminDeleteRequestFromDB = async (rentalrequestId: string) => {
    const rental_request = await prisma.rentalRequest.findUniqueOrThrow({
        where: {
            id: rentalrequestId,
        },
    });
    if (rental_request.status !== "DELETED") {
        throw new Error("You cannot delete this, it is in process");
    }

    await prisma.rentalRequest.delete({
        where: {
            id: rentalrequestId,
        },
    });
    return null;
};

const createSubscriptionCheckoutSession = async (
    id: string,
    userId: string,
) => {
    const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
        where: { id },
        include: { property: true },
    });

    if (rentalRequest.tenantId !== userId) {
        throw new Error(
            "You are not allowed to subscribe to this rental request",
        );
    }

    if (rentalRequest.status !== RentalRequestStatus.APPROVED) {
        throw new Error("This rental request has not been approved yet");
    }

    if (!rentalRequest.property.stripePriceId) {
        throw new Error(
            "This property does not have a Stripe price configured",
        );
    }

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
            {
                price: rentalRequest.property.stripePriceId,
                quantity: 1,
            },
        ],
        metadata: {
            rentalRequestId: rentalRequest.id,
        },
        success_url: `${config.client_url}/rentals/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.client_url}/rentals/${rentalRequest.id}`,
    });

    await prisma.rentalRequest.update({
        where: { id: rentalRequest.id },
        data: { stripeSessionId: session.id },
    });

    return { url: session.url };
};

// 4. Called from the webhook once Stripe confirms the subscription payment.
const completeRentalRequestById = async (
    id: string,
    stripeSubscriptionId: string,
) => {
    return prisma.rentalRequest.update({
        where: { id },
        data: {
            status: RentalRequestStatus.COMPLETED,
            stripeSubscriptionId,
        },
    });
};

export const rentalRequestServices = {
    createRequestIntoDB,
    getAllRequestsFromDB,
    getSingleRequestFromDB,
    getMySentRequestFromDB,
    getRentalRequestToMyPropertyFromDB,
    adminDeleteRequestFromDB,
    tenantWithdrawRequestIntoDB,
    handleRequestStatusIntoDB,
    createSubscriptionCheckoutSession,
    completeRentalRequestById,
};
