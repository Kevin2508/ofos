import { Router } from "express";
const restaurantRouter = Router();
import * as restaurantController from "./restaurant.controller.ts";

restaurantRouter.get("/", restaurantController.getRestaurants);

restaurantRouter.get("/featured", restaurantController.getFeaturedRestaurants);

restaurantRouter.get("/:id", restaurantController.getRestaurantDetails);

restaurantRouter.get("/:id/menu", restaurantController.getRestaurantMenu);

export { restaurantRouter };
