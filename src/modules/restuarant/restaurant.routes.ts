import { Router } from "express";
const restrouter = Router();
import * as restaurantController from "./restaurant.controller.ts";

restrouter.get("/", restaurantController.getRestaurants);

restrouter.get("/featured", restaurantController.getFeaturedRestaurants);

restrouter.get("/:id", restaurantController.getRestaurantDetails);

restrouter.get("/:id/menu", restaurantController.getRestaurantMenu);

export default restrouter ;