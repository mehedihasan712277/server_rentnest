import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { propertyController } from "./property.controller";

const router = Router();

router.post(
    "/",
    auth(Role.ADMIN, Role.LANDLORD),
    propertyController.createProperty,
);

router.get("/", propertyController.getAllProperty);

router.get(
    "/my-properties",
    auth(Role.ADMIN, Role.LANDLORD),
    propertyController.getMyOwnPropertyList,
);

router.get("/:propertyId", propertyController.getOneProperty);

router.put(
    "/:propertyId",
    auth(Role.LANDLORD, Role.ADMIN),
    propertyController.updateProperty,
);
router.put(
    "/change-status/:propertyId",
    auth(Role.ADMIN, Role.LANDLORD),
    propertyController.togglePropertyStatus,
);

router.delete(
    "/:propertyId",
    auth(Role.LANDLORD, Role.ADMIN),
    propertyController.deleteProperty,
);

export const propertyRouter = router;
