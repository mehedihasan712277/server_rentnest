import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { categoryController } from "./category.controller";

const router = Router();

router.post("/", auth(Role.ADMIN), categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.get("/:categoryId", auth(Role.ADMIN), categoryController.getOneCategory);
router.delete(
    "/:categoryId",
    auth(Role.ADMIN),
    categoryController.deleteCategory,
);
router.put("/:categoryId", auth(Role.ADMIN), categoryController.updateCategory);

export const categoryRouter = router;
