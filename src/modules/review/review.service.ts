import { prisma } from "../../lib/prisma";
import { IReviewPayload } from "./review.interface";

const createReviewIntoDB = async (payload: IReviewPayload) => {
    if (
        !payload.propertyId ||
        !payload.rentalRequestId ||
        !payload.tenantId ||
        !payload.rating ||
        !payload.comment
    ) {
        throw new Error(
            "propertyId, rentalRequestId, tenantId, rating, and comment are required",
        );
    }

    const checkOwnership = await prisma.property.findFirst({
        where: {
            id: payload.propertyId,
            landlordId: {
                not: payload.tenantId,
            },
        },
    });

    if (!checkOwnership) {
        throw new Error("subscribe first to comment on this property.");
    }

    const result = await prisma.review.create({
        data: payload,
    });
    return result;
};

const getAllReviewsFrmDB = async () => {};
const getMyReviewsFromDB = async () => {};
const getReviewsToMyPropertyFromDB = async () => {};
const deleteReviewFromDB = async () => {};
const updateReviewIntoDB = async () => {};
const handleReviewStatusIntoDB = async () => {};

export const reviewServices = {
    createReviewIntoDB,
    getAllReviewsFrmDB,
    getMyReviewsFromDB,
    getReviewsToMyPropertyFromDB,
    deleteReviewFromDB,
    updateReviewIntoDB,
    handleReviewStatusIntoDB,
};
