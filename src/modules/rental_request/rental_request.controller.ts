import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import HttpStatus from "http-status";
import { rentalRequestServices } from "./rental_request.service";

const createRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const tenantId = req.user?.id;
        const payload = { ...req.body, tenantId };
        const result = await rentalRequestServices.createRequestIntoDB(payload);

        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.CREATED,
            message: "successfully",
            data: result,
        });
    },
);

const getAllRequests = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await rentalRequestServices.getAllRequestsFromDB();
        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.OK,
            count: result.length,
            message: "all requests retrived successfully",
            data: result,
        });
    },
);

const getSingleRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "successfully",
            data: {},
        });
    },
);

const getMySentRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await rentalRequestServices.getMySentRequestFromDB(
            req.user?.id as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: 200,
            count: result.length,
            message: "my sent requests retrived successfully",
            data: result,
        });
    },
);

const getRentalRequestToMyProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result =
            await rentalRequestServices.getRentalRequestToMyPropertyFromDB(
                req.user?.id as string,
            );
        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.OK,
            message: "rental request to my properties retrived successfully",
            data: result,
        });
    },
);

const updateRequestStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.requestId;

        if (!id) {
            throw new Error("rental request id not provided");
        }

        const result = await rentalRequestServices.updateRequestStatusIntoDB(
            id as string,
            req.body,
        );
        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.OK,
            message: "request status updated successfully",
            data: result,
        });
    },
);

const deleteRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const rentalrequestId = req.params.requestId;

        if (!rentalrequestId) {
            throw new Error("id not provided");
        }

        await rentalRequestServices.deleteRequestFromDB(
            rentalrequestId as string,
            req.user?.id as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.OK,
            message: "request deleted successfully",
            data: null,
        });
    },
);

export const rentalRequestController = {
    createRequest,
    getAllRequests,
    getSingleRequest,
    getMySentRequest,
    getRentalRequestToMyProperty,
    updateRequestStatus,
    deleteRequest,
};
