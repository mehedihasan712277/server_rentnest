import { Router } from "express";
import { rentalRequestController } from "./rental_request.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/", auth(Role.TENANT), rentalRequestController.createRequest);
router.get("/", auth(Role.ADMIN), rentalRequestController.getAllRequests);
router.get(
    "/my-sent-request",
    auth(Role.TENANT),
    rentalRequestController.getMySentRequest,
);
router.get(
    "/rental-request-to-me",
    auth(Role.LANDLORD),
    rentalRequestController.getRentalRequestToMyProperty,
);
// router.get(
//     "/:requestId",
//     auth(Role.ADMIN, Role.LANDLORD),
//     rentalRequestController.getSingleRequest,
// );
router.put(
    "/tenant-delete/:requestId",
    auth(Role.TENANT),
    rentalRequestController.tenantDeleteRequest,
);
router.put(
    "/:requestId",
    auth(Role.LANDLORD),
    rentalRequestController.updateRequestStatus,
);
router.delete(
    "/:requestId",
    auth(Role.ADMIN),
    rentalRequestController.deleteRequest,
);

// User pays for an approved request -> creates the Stripe subscription checkout
router.post(
    "/:id/subscribe",
    auth(Role.TENANT),
    rentalRequestController.subscribeToRentalRequest,
);

export const rentalRequestRouter = router;
