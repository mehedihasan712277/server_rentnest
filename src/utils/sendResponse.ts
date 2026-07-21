import { Response } from "express";
import { count } from "node:console";

type TMeta = {
    page: number;
    limit: number;
    total: number;
};

type TResponsedata<T> = {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    meta?: TMeta;
    count?: number;
};

export const sendResponse = <T>(res: Response, data: TResponsedata<T>) => {
    res.status(data.statusCode).json({
        success: data.success,
        statusCode: data.statusCode,
        count: data.count,
        message: data.message,
        data: data.data,
        meta: data.meta,
    });
};
