import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.ts";
import { upload } from "../../middlewares/upload.middleware.ts";
import {
  deactivateRestaurant,
  getMyRestaurants,
  pauseRestaurant,
  registerRestaurant,
  resumeRestaurant,
  updateRestaurant,
  uploadCover,
  uploadDocument,
  uploadLogo,
  getDashboardStats,
  getFinanceStats,
} from "./management.controller.ts";
import {
  createRestaurantSchema,
  pauseRestaurantSchema,
  updateRestaurantSchema,
  uploadDocumentSchema,
} from "./management.validation.ts";
import { authenticate } from "../../middlewares/auth.middleware.ts";

const restaurantManagementRouter = Router();

restaurantManagementRouter.post(
  "/",
  authenticate,
  validate(createRestaurantSchema),
  registerRestaurant
);

restaurantManagementRouter.get("/mine", authenticate, getMyRestaurants);
restaurantManagementRouter.get("/dashboard-stats", authenticate, getDashboardStats);
restaurantManagementRouter.get("/finance-stats", authenticate, getFinanceStats);

restaurantManagementRouter.patch(
  "/:id",
  authenticate,
  validate(updateRestaurantSchema),
  updateRestaurant
);

restaurantManagementRouter.post(
  "/:id/logo",
  authenticate,
  upload.single("logo"),
  uploadLogo
);

restaurantManagementRouter.post(
  "/:id/cover",
  authenticate,
  upload.single("cover"),
  uploadCover
);

restaurantManagementRouter.post(
  "/:id/documents",
  authenticate,
  upload.single("document"),
  validate(uploadDocumentSchema),
  uploadDocument
);

restaurantManagementRouter.patch(
  "/:id/pause",
  authenticate,
  validate(pauseRestaurantSchema),
  pauseRestaurant
);

restaurantManagementRouter.patch("/:id/resume", authenticate, resumeRestaurant);

restaurantManagementRouter.delete("/:id", authenticate, deactivateRestaurant);

export { restaurantManagementRouter };