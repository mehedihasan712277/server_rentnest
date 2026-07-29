import { ReviewStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IReviewPayload } from "./review.interface";

const createReviewIntoDB = async (payload: IReviewPayload) => {
    if (
        !payload.propertyId ||
        !payload.tenantId ||
        !payload.rating ||
        !payload.comment
    ) {
        throw new Error(
            "propertyId, tenantId, rating, and comment are required",
        );
    }

    const checkOwnership = await prisma.rental.findFirst({
        where: {
            propertyId: payload.propertyId,
            tenantId: payload.tenantId,
        },
    });

    if (!checkOwnership) {
        throw new Error("subscribe first to comment on this property.");
    }

    const property = await prisma.property.findFirstOrThrow({
        where: {
            id: payload.propertyId,
        },
        include: {
            rentalRequests: {
                select: {
                    id: true,
                },
            },
        },
    });

    if (!property) {
        throw new Error("failed to find rentalrequest id");
    }
    const data = {
        ...payload,
        rentalRequestId: property.rentalRequests[0]?.id as string,
    };

    const result = await prisma.review.create({
        data,
    });
    return result;
};

const getAllReviewsFrmDB = async () => {
    const result = await prisma.review.findMany({
        include: {
            property: {
                select: {
                    title: true,
                    description: true,
                    landlord: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    price: true,
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            tenant: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });
    return result;
};
const getMyReviewsFromDB = async (tenantId: string) => {
    const result = await prisma.review.findMany({
        where: {
            tenantId: tenantId,
        },
        include: {
            property: {
                select: {
                    title: true,
                    description: true,
                    landlord: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    return result;
};
const getReviewsToMyPropertyFromDB = async (landlordId: string) => {
    const result = await prisma.review.findMany({
        where: {
            property: {
                landlordId,
            },
        },
        include: {
            property: {
                select: {
                    title: true,
                    description: true,
                },
            },
            tenant: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });
    return result;
};
const deleteReviewFromDB = async (reviewId: string) => {
    const result = await prisma.review.delete({
        where: {
            id: reviewId,
        },
    });
    return null;
};
const updateReviewIntoDB = async (
    reviewId: string,
    payload: { comment: string; rating?: number },
) => {
    const result = await prisma.review.update({
        where: {
            id: reviewId,
        },
        data: {
            comment: payload.comment,
            rating: payload.rating,
        },
    });
    return result;
};

const handleReviewStatusIntoDB = async (
    reviewId: string,
    status: ReviewStatus,
) => {
    const result = await prisma.review.update({
        where: {
            id: reviewId,
        },
        data: {
            status: status as ReviewStatus,
        },
    });
    return result;
};

export const reviewServices = {
    createReviewIntoDB,
    getAllReviewsFrmDB,
    getMyReviewsFromDB,
    getReviewsToMyPropertyFromDB,
    deleteReviewFromDB,
    updateReviewIntoDB,
    handleReviewStatusIntoDB,
};
