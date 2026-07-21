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
        throw new Error("you cannot request for your own pro[erty");
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
        data: payload,
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

const updateRequestStatusIntoDB = async (
    rentalrequestId: string,
    payload: { status: RentalRequestStatus },
) => {
    const result = await prisma.rentalRequest.update({
        where: {
            id: rentalrequestId,
        },
        data: {
            status: payload.status,
        },
    });

    return result;
};

const deleteRequestFromDB = async (
    rentalrequestId: string,
    tenantId: string,
) => {
    const rental_request = await prisma.rentalRequest.findUniqueOrThrow({
        where: {
            id: rentalrequestId,
        },
    });

    if (rental_request.tenantId !== tenantId) {
        throw new Error("you cannot delete others' rental request");
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
    updateRequestStatusIntoDB,
    deleteRequestFromDB,
};
