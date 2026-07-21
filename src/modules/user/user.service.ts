import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { RegisterUserPayload } from "./user.interface";
import { ActiveStatus } from "../../../generated/prisma/enums";

const createUserIntoDB = async (payload: RegisterUserPayload) => {
    const { name, email, password, profilePhoto, role } = payload;

    if (role === "ADMIN" && payload.key !== config.admin_registration_key) {
        throw new Error("provide correct key to create admin");
    }

    const hashedPassword = await bcrypt.hash(
        password,
        Number(config.bcrypt_salt_rounds),
    );

    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            profile: {
                create: {
                    profilePhoto,
                },
            },
        },
    });

    const user = await prisma.user.findUnique({
        where: {
            id: createdUser.id,
            email: createdUser.email || email,
        },
        omit: {
            password: true,
        },
        include: {
            profile: true,
        },
    });

    return user;
};

const getMyProfileFromDB = async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: userId,
        },
        omit: { password: true },
        include: {
            profile: true,
            properties: true,
            amenity: true,
            rentalRequests: true,
            reviews: true,
            rentals: true,
        },
    });

    return user;
};

const updateMyprofileInDB = async (
    userId: string,
    status: ActiveStatus,
    payload: any,
) => {
    const { name, profilePhoto, bio } = payload;

    if (status === "BLOCKED") {
        throw new Error("you are blocked by admin");
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            name,
            profile: {
                update: {
                    profilePhoto,
                    bio,
                },
            },
        },
        omit: {
            password: true,
        },
        include: { profile: true },
    });

    return updatedUser;
};

const getAllUsersFromDB = async () => {
    const result = await prisma.user.findMany({
        where: {
            role: {
                not: "ADMIN",
            },
        },
        omit: {
            password: true,
        },
        include: {
            profile: true,
            properties: true,
            rentalRequests: true,
            amenity: {
                select: {
                    name: true,
                },
            },
            reviews: true,
            payments: true,
        },
    });
    return result;
};

const handleUserInDB = async (userId: string, status: ActiveStatus) => {
    const result = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            status,
        },
    });

    return result;
};

export const userService = {
    createUserIntoDB,
    getMyProfileFromDB,
    updateMyprofileInDB,
    getAllUsersFromDB,
    handleUserInDB,
};
