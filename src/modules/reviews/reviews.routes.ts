import { Router } from "express";
import * as reviewsController from "./reviews.controller.ts";
import { authenticate, authorize } from "../../middlewares/auth.middleware.ts";
import { upload } from "../../middlewares/upload.middleware.ts";

const router = Router();

// Public / Customer endpoint to get reviews
router.get("/restaurants/:restaurantId", reviewsController.getRestaurantReviewsController);

// Customer endpoint to submit a review (up to 3 images)
router.post(
  "/orders/:orderId",
  authenticate,
  authorize(["Customer"]),
  upload.array("images", 3),
  reviewsController.submitReviewController
);

// Restaurant Owner endpoint to view their own reviews
router.get(
  "/owner",
  authenticate,
  authorize(["Restaurant_owner"]),
  reviewsController.getOwnerReviewsController
);

// Restaurant Owner endpoint to reply
router.post(
  "/:reviewId/reply",
  authenticate,
  authorize(["Restaurant_owner"]),
  reviewsController.replyToReviewController
);

export default router;
