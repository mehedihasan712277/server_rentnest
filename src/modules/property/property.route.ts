import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { propertyController } from "./property.controller";

const router = Router();

router.post("/", auth(Role.LANDLORD), propertyController.createProperty);

router.get("/", propertyController.getAllProperty);
router.get(
    "/admin",
    auth(Role.ADMIN),
    propertyController.getAllPropertyForAdmin,
);

router.get(
    "/my-properties",
    auth(Role.ADMIN, Role.LANDLORD),
    propertyController.getMyOwnPropertyList,
);

// router.get("/:propertyId", propertyController.getSingleProperty);
router.get("/:propertyId", propertyController.getOneProperty);

router.put(
    "/:propertyId",
    auth(Role.LANDLORD),
    propertyController.updateProperty,
);
router.put(
    "/change-status/:propertyId",
    auth(Role.LANDLORD),
    propertyController.togglePropertyStatus,
);

router.delete(
    "/:propertyId",
    auth(Role.LANDLORD),
    propertyController.deleteProperty,
);

export const propertyRouter = router;
