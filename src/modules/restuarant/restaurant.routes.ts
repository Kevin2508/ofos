import { Router } from "express";
const router = Router();
import * as restaurantController from "./restaurant.controller.ts";

router.get("/", restaurantController.getRestaurants);

router.get("/featured", restaurantController.getFeaturedRestaurants);

router.get("/:id", restaurantController.getRestaurantDetails);

router.get("/:id/menu", restaurantController.getRestaurantMenu);

export default router ;