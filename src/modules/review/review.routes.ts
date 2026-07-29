import { Router } from "express";
import { reviewControllers } from "./review.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/", auth(Role.TENANT), reviewControllers.createReview);
router.get("/", auth(Role.ADMIN), reviewControllers.getAllReviews);
router.get("/me", auth(Role.TENANT), reviewControllers.getMyReviews);
router.get(
    "/my-properties",
    auth(Role.LANDLORD),
    reviewControllers.getReviewsToMyProperty,
);
router.put("/:reviewId", auth(Role.TENANT), reviewControllers.updateReview);
router.delete("/:reviewId", auth(Role.TENANT), reviewControllers.deleteReview);

export const reviewRouter = router;
