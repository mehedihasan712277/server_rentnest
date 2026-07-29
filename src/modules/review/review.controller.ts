import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
const createReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = { ...req.body, tenantId: req.user?.id as string };
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "review posted successfully",
            data: {},
        });
    },
);
const getAllReviews = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        sendResponse(res, {
            success: true,
            count: 0,
            statusCode: httpStatus.OK,
            message: "all reviews retrived successfully",
            data: {},
        });
    },
);
const getMyReviews = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        sendResponse(res, {
            success: true,
            count: 0,
            statusCode: httpStatus.OK,
            message: "My reviews retrived successfully",
            data: {},
        });
    },
);
const getReviewsToMyProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        sendResponse(res, {
            success: true,
            count: 0,
            statusCode: httpStatus.OK,
            message: " reviews to my properties retrived successfully",
            data: {},
        });
    },
);
const deleteReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: " review deleted successfully",
            data: null,
        });
    },
);
const updateReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "review updated successfully",
            data: {},
        });
    },
);

const handleReviewStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "review updated successfully",
            data: {},
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
