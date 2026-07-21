import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { userService } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ActiveStatus } from "../../../generated/prisma/enums";

const createUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;

        const user = await userService.createUserIntoDB(payload);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "user registered successfully",
            data: { user },
        });
    },
);

const getMyProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const profile = await userService.getMyProfileFromDB(
            req.user?.id as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "user profile retrived successfully",
            data: profile,
        });
    },
);

const updateMyprofile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = req.user?.id as string;
        const status = req.user?.userStatus as ActiveStatus;
        const payload = req.body;

        const updatedUser = await userService.updateMyprofileInDB(
            id,
            status,
            payload,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "user profile updated successfully",
            data: { updatedUser },
        });
    },
);

const getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await userService.getAllUsersFromDB();

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            count: result.length,
            message: "all users retrived successfully",
            data: result,
        });
    },
);

const handleUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id, status } = req.body;

        const result = await userService.handleUserInDB(id, status);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "user profile deleted successfully",
            data: result,
        });
    },
);
export const userController = {
    getMyProfile,
    updateMyprofile,
    getAllUsers,
    handleUser,
    createUser,
};
