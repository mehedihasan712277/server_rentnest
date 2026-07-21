import { Router } from "express";
import { amenityController } from "./amenity.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/",
    auth(Role.ADMIN, Role.LANDLORD),
    amenityController.createAmenity,
);
router.get("/", amenityController.getAmenity);
router.get("/:amenityId", auth(Role.ADMIN), amenityController.getSingleAmenity);
router.delete(
    "/:amenityId",
    auth(Role.ADMIN, Role.LANDLORD),
    amenityController.deleteAmenity,
);

export const amenityRouter = router;
