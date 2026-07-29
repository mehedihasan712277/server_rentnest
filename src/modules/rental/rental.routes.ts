import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { rentalController } from "./rental.controller";

const router = Router();

router.get(
    "/all-rental-info",
    auth(Role.ADMIN),
    rentalController.getAllRentalInfo,
);

router.get("/my-rentals", auth(Role.TENANT), rentalController.getMyRentals);

router.get(
    "/my-property-rentals",
    auth(Role.LANDLORD),
    rentalController.getMyPropertyRentals,
);

router.get(
    "/access/:propertyId",
    auth(Role.TENANT),
    rentalController.checkPropertyAccess,
);

export const rentalRouter = router;
