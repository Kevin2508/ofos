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
} from "./management.controller.ts";
import {
  createRestaurantSchema,
  pauseRestaurantSchema,
  updateRestaurantSchema,
  uploadDocumentSchema,
} from "./management.validation.ts";
import { authenticate } from "../../middlewares/auth.middleware.ts";

const restaurantRouter = Router();

restaurantRouter.post(
  "/",
  authenticate,
  validate(createRestaurantSchema),
  registerRestaurant
);

restaurantRouter.get("/mine", authenticate, getMyRestaurants);

restaurantRouter.patch(
  "/:id",
  authenticate,
  validate(updateRestaurantSchema),
  updateRestaurant
);

restaurantRouter.post(
  "/:id/logo",
  authenticate,
  upload.single("logo"),
  uploadLogo
);

restaurantRouter.post(
  "/:id/cover",
  authenticate,
  upload.single("cover"),
  uploadCover
);

restaurantRouter.post(
  "/:id/documents",
  authenticate,
  upload.single("document"),
  validate(uploadDocumentSchema),
  uploadDocument
);

restaurantRouter.patch(
  "/:id/pause",
  authenticate,
  validate(pauseRestaurantSchema),
  pauseRestaurant
);

restaurantRouter.patch("/:id/resume", authenticate, resumeRestaurant);

restaurantRouter.delete("/:id", authenticate, deactivateRestaurant);

export { restaurantRouter };