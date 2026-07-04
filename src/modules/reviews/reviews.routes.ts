import { Router } from "express";
import * as reviewsController from "./reviews.controller.ts";
import { authenticate, authorize } from "../../middlewares/auth.middleware.ts";
import { upload } from "../../middlewares/upload.middleware.ts";

const router = Router();

router.get("/restaurants/:restaurantId", reviewsController.getRestaurantReviewsController);

router.post(
  "/orders/:orderId",
  authenticate,
  authorize(["Customer"]),
  upload.array("images", 3),
  reviewsController.submitReviewController
);

router.get(
  "/owner",
  authenticate,
  authorize(["Restaurant_owner"]),
  reviewsController.getOwnerReviewsController
);

router.post(
  "/:reviewId/reply",
  authenticate,
  authorize(["Restaurant_owner"]),
  reviewsController.replyToReviewController
);

export default router;
