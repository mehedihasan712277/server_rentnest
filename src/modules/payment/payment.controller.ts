import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { paymentServices } from "./payment.service";

// Admin: all payment history
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
    const result = await paymentServices.getAllPaymentsFromDB();
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        count: result.length,
        message: "all payments retrieved successfully",
        data: result,
    });
});

// Tenant: their own payment history
const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const result = await paymentServices.getMyPaymentsFromDB(req.user!.id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        count: result.length,
        message: "your payments retrieved successfully",
        data: result,
    });
});

// Landlord: payments received on their properties
const getPaymentsOnMyProperties = catchAsync(
    async (req: Request, res: Response) => {
        const result = await paymentServices.getPaymentsOnMyPropertiesFromDB(
            req.user!.id,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            count: result.length,
            message: "payments on your properties retrieved successfully",
            data: result,
        });
    },
);

export const paymentController = {
    getAllPayments,
    getMyPayments,
    getPaymentsOnMyProperties,
};
