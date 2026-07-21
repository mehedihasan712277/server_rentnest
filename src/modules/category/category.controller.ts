import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { categoryService } from "./category.service";

const createCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await categoryService.createCategoryIntoDB(req.body);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "category created successfully",
            data: result,
        });
    },
);

const getAllCategories = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await categoryService.getAllCategoriesFromDB();

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            count: result.length,
            message: "all categories retrived  successfully",
            data: result,
        });
    },
);

const getOneCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const categoryId = req.params.categoryId;
        if (!categoryId) {
            throw new Error("category id not provided");
        }
        const result = await categoryService.getOneCategoryFromDb(
            categoryId as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "category retrived successfully",
            data: result,
        });
    },
);

const deleteCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const categoryId = req.params.categoryId;
        if (!categoryId) {
            throw new Error("category id not provided");
        }

        await categoryService.deleteCategoryFromDB(categoryId as string);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "category deleted successfully",
            data: null,
        });
    },
);

const updateCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const categoryId = req.params.categoryId;
        if (!categoryId) {
            throw new Error("category id not provided");
        }

        const result = await categoryService.updateCategoryIntoDB(
            req.body,
            categoryId as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "category updated successfully",
            data: result,
        });
    },
);

export const categoryController = {
    createCategory,
    getAllCategories,
    getOneCategory,
    deleteCategory,
    updateCategory,
};
