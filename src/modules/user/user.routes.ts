import { Router } from "express";
import { userController } from "./user.controller";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";

const router = Router();

router.post("/create-user", auth(Role.ADMIN), userController.createUser);

router.get(
    "/my-profile",
    auth(Role.ADMIN, Role.TENANT, Role.LANDLORD),
    userController.getMyProfile,
);

router.put(
    "/update-profile",
    auth(Role.ADMIN, Role.TENANT, Role.LANDLORD),
    userController.updateMyprofile,
);

router.get("/all", auth(Role.ADMIN), userController.getAllUsers);
router.put("/delete-account", auth(Role.ADMIN), userController.handleUser);

export const userRoutes = router;
