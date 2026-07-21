import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { amenityService } from "./amenity.service";
import HttpStatus from "http-status";

const createAmenity = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const creatorId = req.user?.id;
        const result = await amenityService.createAmenityIntoDB({
            ...req.body,
            creatorId,
        });
        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.CREATED,
            message: "amenity created successfully",
            data: result,
        });
    },
);
const getAmenity = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await amenityService.getAmenityFromDB();
        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.OK,
            message: "all amenities retrived successfully",
            count: result.length,
            data: result,
        });
    },
);
const getSingleAmenity = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const amenityId = req.params.amenityId;
        if (!amenityId) {
            throw new Error("amenity id not provided");
        }
        const result = await amenityService.getSingleAmenityFromDB(
            amenityId as string,
        );
        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.OK,
            message: "amenity retrived successfully",
            data: result,
        });
    },
);
const deleteAmenity = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const amenityId = req.params.amenityId;
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!amenityId) {
            throw new Error("amenity id not provided");
        }

        await amenityService.deleteAmenityFromDB(
            amenityId as string,
            userId as string,
            role as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: HttpStatus.OK,
            message: "amenity deleted successfully",
            data: null,
        });
    },
);

export const amenityController = {
    createAmenity,
    getAmenity,
    getSingleAmenity,
    deleteAmenity,
};
