import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.ts';

const customerPageRouter = Router();

customerPageRouter.use(authenticate);

customerPageRouter.use(authorize('Customer'));

customerPageRouter.get("/cart", (req, res) => {
  res.render("customer/cart");
});

customerPageRouter.get("/checkout", (req, res) => {
  res.render("customer/checkout");
});

customerPageRouter.get("/tracking/:id", (req, res) => {
  res.render("customer/order-tracking");
});

customerPageRouter.get("/order-confirmation/:id", (req, res) => {
  res.render("customer/order-confirmation");
});

customerPageRouter.get("/orders", (req, res) => {
  res.render("customer/orders");
});

customerPageRouter.get("/orders/:id", (req, res) => {
  res.render("customer/order-detail");
});

customerPageRouter.get("/profile", (req, res) => {
  res.render("customer/profile");
});

export { customerPageRouter };
