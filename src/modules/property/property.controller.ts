import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { propertyService } from "./property.service";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";

const createProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const landlordId = req.user?.id;
        const result = await propertyService.createPropertyIntoDB(
            req.body,
            landlordId as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "properties created successfully",
            data: result,
        });
    },
);

const getAllProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const query = req.query;
        const result = await propertyService.getAllPropertyFromDB(query);
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            count: result.length,
            message: "all properties retrived successfully",
            data: result,
        });
    },
);

const getMyOwnPropertyList = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await propertyService.getMyOwnPropertyListFromDB(
            req.user?.id as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            count: result.length,
            message: "my properties retrived successfully",
            data: result,
        });
    },
);

const getOneProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const propertyId = req.params.propertyId;
        if (!propertyId) {
            throw new Error("property id not provided");
        }
        const result = await propertyService.getOnePropertyFromDB(
            propertyId as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "property retrived successfully",
            data: result,
        });
    },
);
const updateProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const propertyId = req.params.propertyId;
        if (!propertyId) {
            throw new Error("property id not provided");
        }

        const result = await propertyService.updatePropertyIntoDB(
            req.body,
            propertyId as string,
            req.user?.id as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "property updated successfully",
            data: result,
        });
    },
);

const togglePropertyStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const propertyId = req.params.propertyId;
        if (!propertyId) {
            throw new Error("property id not provided");
        }

        const result = await propertyService.togglePropertyStatusIntoDB(
            propertyId as string,
            req.user?.role as Role,
            req.user?.id as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "property status changed successfully",
            data: result,
        });
    },
);

const deleteProperty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const propertyId = req.params.propertyId;
        if (!propertyId) {
            throw new Error("property id not provided");
        }
        const result = await propertyService.deletePropertyFromDB(
            propertyId as string,
            req.user?.id as string,
            req.user?.role as Role,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "property deleted successfully",
            data: result,
        });
    },
);

export const propertyController = {
    createProperty,
    getAllProperty,
    getMyOwnPropertyList,
    getOneProperty,
    updateProperty,
    togglePropertyStatus,
    deleteProperty,
};
