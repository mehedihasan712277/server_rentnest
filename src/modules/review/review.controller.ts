import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { reviewServices } from "./review.service";
import { ReviewStatus } from "../../../generated/prisma/client";
const createReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = { ...req.body, tenantId: req.user?.id as string };
        const result = await reviewServices.createReviewIntoDB(payload);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "review posted successfully",
            data: result,
        });
    },
);
const getAllReviews = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await reviewServices.getAllReviewsFrmDB();
        sendResponse(res, {
            success: true,
            count: result.length,
            statusCode: httpStatus.OK,
            message: "all reviews retrived successfully",
            data: result,
        });
    },
);
const getMyReviews = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await reviewServices.getMyReviewsFromDB(req.user!.id);
        sendResponse(res, {
            success: true,
            count: result.length,
            statusCode: httpStatus.OK,
            message: "My reviews retrived successfully",
            data: result,
        });
    },
);
const getReviewsToMyProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await reviewServices.getReviewsToMyPropertyFromDB(
            req.user!.id,
        );
        sendResponse(res, {
            success: true,
            count: result.length,
            statusCode: httpStatus.OK,
            message: " reviews to my properties retrived successfully",
            data: result,
        });
    },
);
const deleteReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { reviewId } = req.params;
        const result = await reviewServices.deleteReviewFromDB(
            reviewId as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: " review deleted successfully",
            data: result,
        });
    },
);
const updateReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { reviewId } = req.params;
        const { comment, rating } = req.body;

        const result = await reviewServices.updateReviewIntoDB(
            reviewId as string,
            { comment, rating },
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "review updated successfully",
            data: result,
        });
    },
);

const handleReviewStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { reviewId } = req.params;
        const { status } = req.body;

        const result = await reviewServices.handleReviewStatusIntoDB(
            reviewId as string,
            status as ReviewStatus,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "review updated successfully",
            data: result,
        });
    },
);

export const reviewControllers = {
    createReview,
    getAllReviews,
    getMyReviews,
    getReviewsToMyProperty,
    deleteReview,
    updateReview,
    handleReviewStatus,
};
