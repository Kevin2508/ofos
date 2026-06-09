import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import cartController from "./cart.controller.ts";
import { addCartItemSchema, updateCartItemSchema } from "./cart.validation.ts";
import { validate } from "../../middlewares/validation.middleware.ts";


const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authenticate);

// GET    /cart                  — get current user's active cart
cartRouter.get("/", cartController.getCart);

// POST   /cart/items            — add an item to cart
cartRouter.post("/items", validate(addCartItemSchema), cartController.addItem);

// PATCH  /cart/items/:itemId    — update quantity / special instructions
cartRouter.patch("/items/:itemId", validate(updateCartItemSchema), cartController.updateItem);

// DELETE /cart/items/:itemId    — remove a single item
cartRouter.delete("/items/:itemId", cartController.removeItem);

// DELETE /cart                  — clear entire cart
cartRouter.delete("/", cartController.clearCart);

// GET    /cart/price-breakdown  — fetch latest price breakdown
cartRouter.get("/price-breakdown", cartController.getPriceBreakdown);

export default cartRouter;