import { Role } from "../../../generated/prisma/enums";
import { PropertyWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IPropertyPayload, IPropertyQuery } from "./property.interface";

const createPropertyIntoDB = async (
    payload: IPropertyPayload,
    landlordId: string,
) => {
    const result = await prisma.property.create({
        data: {
            landlordId,
            categoryId: payload.categoryId,

            title: payload.title,
            description: payload.description,
            location: payload.location,
            price: payload.price,
            area: payload.area,
            thumbnail: payload.thumbnail,

            amenities: {
                connect: payload.amenityIds.map((id) => ({ id })),
            },
        },
    });

    return result;
};

const getAllPropertyFromDB = async (query: IPropertyQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andCondition: PropertyWhereInput[] = [];
    const amenities = query.amenities
        ? JSON.parse(query.amenities as string)
        : null;
    const amenitiesArray = Array.isArray(amenities) ? amenities : [];

    if (query.searchTerm) {
        andCondition.push({
            OR: [
                {
                    title: {
                        contains: query.searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: query.searchTerm,
                        mode: "insensitive",
                    },
                },
            ],
        });
    }
    if (query.categoryId) {
        andCondition.push({
            categoryId: query.categoryId,
        });
    }

    if (query.location) {
        andCondition.push({
            location: query.location,
        });
    }

    if (query.amenities) {
        andCondition.push({
            amenities: {
                some: {
                    id: {
                        in: amenitiesArray,
                    },
                },
            },
        });
    }

    // price range filtering
    if (query.minPrice || query.maxPrice) {
        andCondition.push({
            price: {
                ...(query.minPrice && { gte: Number(query.minPrice) }),
                ...(query.maxPrice && { lte: Number(query.maxPrice) }),
            },
        });
    }

    const result = await prisma.property.findMany({
        where: {
            AND: andCondition,
            status: "AVAILABLE",
        },
        take: limit,
        skip: skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            reviews: true,
            landlord: {
                select: {
                    name: true,
                },
            },
            amenities: {
                select: {
                    name: true,
                    description: true,
                },
            },
            category: {
                select: {
                    name: true,
                },
            },
        },
    });
    return result;
};

const getAllPropertyForAdminFromDB = async (query: IPropertyQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andCondition: PropertyWhereInput[] = [];
    const amenities = query.amenities
        ? JSON.parse(query.amenities as string)
        : null;
    const amenitiesArray = Array.isArray(amenities) ? amenities : [];

    if (query.searchTerm) {
        andCondition.push({
            OR: [
                {
                    title: {
                        contains: query.searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: query.searchTerm,
                        mode: "insensitive",
                    },
                },
            ],
        });
    }
    if (query.category) {
        andCondition.push({
            category: query.category,
        });
    }

    if (query.location) {
        andCondition.push({
            location: query.location,
        });
    }

    if (query.amenities) {
        andCondition.push({
            amenities: {
                some: {
                    id: {
                        in: amenitiesArray,
                    },
                },
            },
        });
    }

    // price range filtering
    if (query.minPrice || query.maxPrice) {
        andCondition.push({
            price: {
                ...(query.minPrice && { gte: Number(query.minPrice) }),
                ...(query.maxPrice && { lte: Number(query.maxPrice) }),
            },
        });
    }

    const result = await prisma.property.findMany({
        where: {
            AND: andCondition,
        },
        take: limit,
        skip: skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            reviews: true,
            landlord: {
                select: {
                    name: true,
                    email: true,
                },
            },
            amenities: {
                select: {
                    name: true,
                    description: true,
                },
            },
            category: {
                select: {
                    name: true,
                },
            },
            rentalRequests: true,
            rentals: true,
        },
    });
    return result;
};

const getMyOwnPropertyListFromDB = async (creatorId: string) => {
    const result = await prisma.property.findMany({
        where: {
            landlordId: creatorId,
        },
        include: {
            amenities: {
                select: {
                    name: true,
                    description: true,
                },
            },
            rentalRequests: true,
            reviews: true,
            rentals: true,
        },
    });
    return result;
};

const getOnePropertyFromDB = async (propertyId: string) => {
    const result = await prisma.property.findUniqueOrThrow({
        where: {
            id: propertyId,
        },
        include: {
            landlord: {
                select: {
                    name: true,
                },
            },
            category: {
                select: {
                    name: true,
                    description: true,
                },
            },
            amenities: {
                select: {
                    name: true,
                    description: true,
                },
            },
            reviews: true,
        },
    });

    return result;
};

const updatePropertyIntoDB = async (
    payload: IPropertyPayload,
    propertyId: string,
    userId: string,
) => {
    const property = await prisma.property.findUniqueOrThrow({
        where: {
            id: propertyId,
        },
        include: {
            rentals: true,
        },
    });

    if (property.landlordId !== userId) {
        throw new Error(
            "you cannot edit it as you dont own it. Only its landord is allowed to edit",
        );
    }

    if (property.rentals.length > 0) {
        throw new Error(
            "the property is in used by tenant so you cannot change it now",
        );
    }

    const result = await prisma.property.update({
        where: {
            id: propertyId,
        },
        data: {
            categoryId: payload.categoryId,

            title: payload.title,
            description: payload.description,
            location: payload.location,
            price: payload.price,
            area: payload.area,
            thumbnail: payload.thumbnail,
            status: payload.status,
            amenities: {
                set: payload.amenityIds?.map((id) => ({ id })),
            },
        },
        include: {
            category: true,
            amenities: true,
        },
    });

    return result;
};

const togglePropertyStatusIntoDB = async (
    propertyId: string,
    role: Role,
    userId: string,
) => {
    // Check if property exists
    const property = await prisma.property.findUniqueOrThrow({
        where: {
            id: propertyId,
        },
        select: {
            status: true,
            landlordId: true,
        },
    });

    // if (role !== "ADMIN" && property.landlordId !== userId) {
    //     throw new Error(
    //         "you cannot change it as you dont own it. Only admin and its landord are allowed to change status",
    //     );
    // }
    if (property.landlordId !== userId) {
        throw new Error(
            "you cannot change it as you dont own it. Only admin and its landord are allowed to change status",
        );
    }

    const result = await prisma.property.update({
        where: {
            id: propertyId,
        },
        data: {
            status:
                property.status === "AVAILABLE" ? "NOTAVAILABLE" : "AVAILABLE",
        },
        select: {
            title: true,
            status: true,
        },
    });

    return result;
};

const deletePropertyFromDB = async (
    propertyId: string,
    userId: string,
    role: Role,
) => {
    const property = await prisma.property.findUniqueOrThrow({
        where: {
            id: propertyId,
        },
        include: {
            rentals: true,
        },
    });

    // if (role !== "ADMIN" && property.landlordId !== userId) {
    //     throw new Error(
    //         "you cannot delete it as you dont own it. Only admin and its landord are allowed to delete",
    //     );
    // }
    if (property.landlordId !== userId) {
        throw new Error(
            "you cannot delete it as you dont own it. Only admin and its landord are allowed to delete",
        );
    }

    if (property.rentals.length > 0) {
        throw new Error("the property is in used by tenant");
    }

    await prisma.property.delete({
        where: {
            id: propertyId,
        },
    });
};

export const propertyService = {
    createPropertyIntoDB,
    getAllPropertyFromDB,
    getAllPropertyForAdminFromDB,
    getMyOwnPropertyListFromDB,
    getOnePropertyFromDB,
    updatePropertyIntoDB,
    togglePropertyStatusIntoDB,
    deletePropertyFromDB,
};
