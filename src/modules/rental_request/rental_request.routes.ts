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
    "/:requestId",
    auth(Role.LANDLORD),
    rentalRequestController.updateRequestStatus,
);
router.delete(
    "/:requestId",
    auth(Role.TENANT),
    rentalRequestController.deleteRequest,
);

export const rentalRequestRouter = router;
