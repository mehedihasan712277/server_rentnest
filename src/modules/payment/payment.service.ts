import { prisma } from "../../lib/prisma";

/**
 * Admin: full payment history across the platform.
 */
const getAllPaymentsFromDB = async () => {
    return prisma.payment.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            rental: {
                select: {
                    id: true,
                    status: true,
                    property: {
                        select: {
                            id: true,
                            title: true,
                            landlord: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

/**
 * Tenant: payments they made (userId on Payment is the tenant).
 */
const getMyPaymentsFromDB = async (userId: string) => {
    return prisma.payment.findMany({
        where: { userId },
        include: {
            rental: {
                select: {
                    id: true,
                    status: true,
                    property: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                            thumbnail: true,
                            price: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

/**
 * Landlord: payments received for rentals on their properties.
 */
const getPaymentsOnMyPropertiesFromDB = async (landlordId: string) => {
    return prisma.payment.findMany({
        where: {
            rental: {
                property: {
                    landlordId,
                },
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            rental: {
                select: {
                    id: true,
                    status: true,
                    property: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

export const paymentServices = {
    getAllPaymentsFromDB,
    getMyPaymentsFromDB,
    getPaymentsOnMyPropertiesFromDB,
};
