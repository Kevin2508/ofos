import { Router } from "express";
import * as orderController from "./order.controller.ts";
import { authenticate } from "../../middlewares/auth.middleware.ts";

const router = Router();

router.get("/", authenticate ,  orderController.getOrders);

export default router;