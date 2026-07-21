import { NextFunction, Request, Response } from "express";
import { ActiveStatus, Role } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";
import { prisma } from "../lib/prisma";

declare global {
    namespace Express {
        interface Request {
            user?: {
                name: string;
                email: string;
                id: string;
                role: Role;
                userStatus: ActiveStatus;
            };
        }
    }
}

export const auth = (...requiredRoles: Role[]) => {
    return catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const token = req.cookies.accessToken
                ? req.cookies.accessToken
                : req.headers.authorization?.startsWith("Bearer ")
                  ? req.headers.authorization?.split(" ")[1]
                  : req.headers.authorization;

            if (!token) {
                throw new Error(
                    "You are not logged in. Please log in to access this resource",
                );
            }

            const verifiedToken = jwtUtils.verifyToken(
                token,
                config.jwt_access_secret,
            );

            if (!verifiedToken.success) {
                throw new Error(verifiedToken.error);
            }

            const { name, email, id, role, status } =
                verifiedToken.data as JwtPayload;

            if (requiredRoles.length && !requiredRoles.includes(role)) {
                return res.status(403).json({
                    success: false,
                    statusCode: httpStatus.FORBIDDEN,
                    message:
                        "Forbidden, you dont have to access to this resource",
                });
            }

            const user = await prisma.user.findUnique({
                where: {
                    id,
                    // name,
                    email,
                    role,
                    // if these fields are there, it needs log in again after updating name and id
                },
            });

            if (!user) {
                throw new Error("User not found. Please log in again");
            }

            if (user.status === "BLOCKED") {
                throw new Error(
                    "Your account has been blocked. Please contact support",
                );
            }

            req.user = {
                id,
                name,
                email,
                role,
                userStatus: status,
            };

            next();
        },
    );
};
