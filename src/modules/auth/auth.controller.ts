import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const loginUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;

        const { accessToken, refreshToken } =
            await authService.loginUser(payload);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24,
            // maxAge: 1000 * 10,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "user logged in successfully",
            data: { accessToken, refreshToken },
        });
    },
);

const refreshToken = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const refreshToken = req.cookies.refreshToken;

        const { accessToken } = await authService.refreshToken(refreshToken);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24,
            // maxAge: 1000 * 10,
        });

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "Token refreshed successfully",
            data: { accessToken },
        });
    },
);

const registerUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;

        const user = await authService.register(payload);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "User registered successfully",
            data: { user },
        });
    },
);

const getMyProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const profile = await authService.getMyProfileFromDB(
            req.user?.id as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User profile fetched successfully",
            data: { profile },
        });
    },
);

const logoutUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: false,
            sameSite: "none",
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "none",
        });

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User logged out successfully",
            data: null,
        });
    },
);

export const authController = {
    loginUser,
    refreshToken,
    registerUser,
    getMyProfile,
    logoutUser, // add this
};
