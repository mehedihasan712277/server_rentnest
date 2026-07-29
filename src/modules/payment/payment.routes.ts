import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { paymentController } from "./payment.controller";

const router = Router();

// Admin: full payment history
router.get("/", auth(Role.ADMIN), paymentController.getAllPayments);

// Tenant: their own payments
router.get("/my-payments", auth(Role.TENANT), paymentController.getMyPayments);

// Landlord: payments received on properties they own
router.get(
    "/my-property-payments",
    auth(Role.LANDLORD),
    paymentController.getPaymentsOnMyProperties,
);

export const paymentRouter = router;
