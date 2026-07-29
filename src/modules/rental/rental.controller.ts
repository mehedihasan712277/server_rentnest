import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { rentalServices } from "./rental.service";

// Tenant: "my rentals" - properties they're currently paying for / have rented before
const getMyRentals = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalServices.getMyRentalsFromDB(req.user!.id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        count: result.length,
        message: "your rentals retrieved successfully",
        data: result,
    });
});

// Landlord: rentals happening on properties they own
const getMyPropertyRentals = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalServices.getMyPropertyRentalsFromDB(
        req.user!.id,
    );
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        count: result.length,
        message: "rentals on your properties retrieved successfully",
        data: result,
    });
});

// Tenant: "do I currently have paid access to this property" - useful for
// frontend gating (e.g. showing exact address, landlord contact info,
// move-in documents, etc.) without exposing that data through a public route.
const checkPropertyAccess = catchAsync(async (req: Request, res: Response) => {
    const { propertyId } = req.params;

    const hasAccess = await rentalServices.hasActiveAccess(
        req.user!.id,
        propertyId as string,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "access check completed",
        data: { hasActiveAccess: hasAccess },
    });
});

// get all rental info for amdmin
const getAllRentalInfo = catchAsync(async (req: Request, res: Response) => {
    const result = await rentalServices.getAllRentalInfoForAdmin();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All rental data retrived",
        data: result,
    });
});

export const rentalController = {
    getMyRentals,
    getMyPropertyRentals,
    checkPropertyAccess,
    getAllRentalInfo,
};
