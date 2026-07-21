import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IAmenityPayload } from "./amenity.interface";

const createAmenityIntoDB = async (payload: IAmenityPayload) => {
    const result = await prisma.amenity.create({
        data: payload,
    });

    return result;
};
const getAmenityFromDB = async () => {
    return prisma.amenity.findMany({
        omit: {
            creatorId: true,
        },
        include: {
            properties: {
                select: {
                    title: true,
                },
            },
            _count: {
                select: {
                    properties: true,
                },
            },
        },
    });
};

const getSingleAmenityFromDB = async (amenityId: string) => {
    return prisma.amenity.findUniqueOrThrow({
        where: {
            id: amenityId,
        },
        include: {
            properties: true,
            _count: {
                select: {
                    properties: true,
                },
            },
        },
    });
};

const deleteAmenityFromDB = async (
    amenityId: string,
    userId: string,
    role: string,
) => {
    const amenity = await prisma.amenity.findUniqueOrThrow({
        where: {
            id: amenityId,
        },
        include: {
            _count: {
                select: {
                    properties: true,
                },
            },
        },
    });

    if (amenity._count.properties > 0) {
        throw new Error(
            "This amenity is currently assigned to one or more properties and cannot be deleted.",
        );
    }

    if (role === Role.LANDLORD && amenity.creatorId !== userId) {
        throw new Error("you cannot delete amenity created by others");
    }

    await prisma.amenity.delete({
        where: {
            id: amenityId,
        },
    });
};
export const amenityService = {
    createAmenityIntoDB,
    getAmenityFromDB,
    getSingleAmenityFromDB,
    deleteAmenityFromDB,
};
