import { RentalRequestStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IRentalRequestPayload } from "./rental_request.interface";

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

const approveRequestStatusIntoDB = async (
    rentalrequestId: string,
    landlordId: string,
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

    if (rental_request.status === "DELETED") {
        throw new Error("You cannot change this, it is deleted");
    }

    if (rental_request.status === "COMPLETED") {
        throw new Error("You cannot change this, it is completed");
    }

    if (rental_request.status === "REJECTED") {
        throw new Error("You cannot change this, it is rejected");
    }

    const result = await prisma.rentalRequest.update({
        where: {
            id: rentalrequestId,
        },
        data: {
            status: "APPROVED",
        },
    });

    return result;
};

const tenantDeleteRequestIntoDB = async (rentalrequestId: string) => {
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
    if (rental_request.status === "DELETED") {
        throw new Error("You cannot delete this, it is in process");
    }

    await prisma.rentalRequest.delete({
        where: {
            id: rentalrequestId,
        },
    });
    return null;
};

export const rentalRequestServices = {
    createRequestIntoDB,
    getAllRequestsFromDB,
    getSingleRequestFromDB,
    getMySentRequestFromDB,
    getRentalRequestToMyPropertyFromDB,
    adminDeleteRequestFromDB,
    tenantDeleteRequestIntoDB,
    approveRequestStatusIntoDB,
};
