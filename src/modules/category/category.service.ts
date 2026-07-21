import { prisma } from "../../lib/prisma";
import { ICategoryPayload } from "./category.interface";

const createCategoryIntoDB = async (payload: ICategoryPayload) => {
    const result = await prisma.category.create({
        data: payload,
    });

    return result;
};

const getAllCategoriesFromDB = async () => {
    const result = await prisma.category.findMany({
        include: {
            _count: {
                select: {
                    properties: true,
                },
            },
            properties: {
                select: {
                    title: true,
                },
            },
        },
    });

    return result;
};

const getOneCategoryFromDb = async (categoryId: string) => {
    const result = await prisma.category.findUniqueOrThrow({
        where: {
            id: categoryId,
        },
        include: {
            _count: {
                select: {
                    properties: true,
                },
            },
            properties: {
                include: {
                    _count: {
                        select: {
                            reviews: true,
                            amenities: true,
                            rentalRequests: true,
                        },
                    },
                    landlord: true,
                    reviews: true,
                    rentalRequests: true,
                    amenities: true,
                },
            },
        },
    });

    return result;
};

const deleteCategoryFromDB = async (categoryId: string) => {
    const category = await prisma.category.findUniqueOrThrow({
        where: {
            id: categoryId,
        },
        include: {
            _count: {
                select: {
                    properties: true,
                },
            },
        },
    });
    if (category._count.properties > 0) {
        throw new Error("you cannot delete the category as it is in used.");
    }
    await prisma.category.delete({
        where: {
            id: categoryId,
        },
    });
    return null;
};

const updateCategoryIntoDB = async (
    payload: ICategoryPayload,
    categoryId: string,
) => {
    const category = await prisma.category.findUniqueOrThrow({
        where: {
            id: categoryId,
        },
        include: {
            _count: {
                select: {
                    properties: true,
                },
            },
        },
    });

    if (category._count.properties > 0) {
        throw new Error("you cannot update the category as it is in use.");
    }

    const result = await prisma.category.update({
        where: {
            id: categoryId,
        },
        data: {
            name: payload.name,
            description: payload.description,
        },
    });

    return result;
};

export const categoryService = {
    createCategoryIntoDB,
    getAllCategoriesFromDB,
    getOneCategoryFromDb,
    deleteCategoryFromDB,
    updateCategoryIntoDB,
};
