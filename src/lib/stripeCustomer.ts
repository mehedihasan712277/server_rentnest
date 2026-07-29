// src/lib/stripeCustomer.ts  (NEW FILE)
import { prisma } from "./prisma";
import { stripe } from "./stripe";

export const getOrCreateStripeCustomer = async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.stripeCustomerId) {
        return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
    });

    await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
    });

    return customer.id;
};
