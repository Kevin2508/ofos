import { Router } from "express";
const restaurantRouter = Router();
import * as restaurantController from "./restaurant.controller.ts";

restaurantRouter.get("/", restaurantController.getRestaurants);

restaurantRouter.get("/global-menu-items", restaurantController.getGlobalMenuItems);

restaurantRouter.get("/featured", restaurantController.getFeaturedRestaurants);

restaurantRouter.get("/branch/:id", restaurantController.getBranchDetails);

restaurantRouter.get("/branch/:id/menu", restaurantController.getBranchMenu);

restaurantRouter.get("/:id", restaurantController.getRestaurantDetails);

restaurantRouter.get("/:id/menu", restaurantController.getRestaurantMenu);

export { restaurantRouter };
