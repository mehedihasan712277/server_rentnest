import { PropertyStatus } from "../../../generated/prisma/enums";
import { PropertyWhereInput } from "../../../generated/prisma/models";

export interface IPropertyPayload {
    categoryId: string;
    title: string;
    description: string;
    location: string;
    price: number;
    area?: number;
    thumbnail?: string;
    amenityIds: string[];
    status?: PropertyStatus;
}

export interface IPropertyQuery extends PropertyWhereInput {
    searchTerm?: string;
    page?: string;
    limit?: string;
    sortOrder?: string;
    sortBy?: string;
    maxPrice?: string;
    minPrice?: string;
}
