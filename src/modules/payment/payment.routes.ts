import { Router } from "express";
import { inititatePayment, verifyPayment, getPaymentDetails } from "./payment.controller.ts";
import { authenticate, authorize } from "../../middlewares/auth.middleware.ts";
const paymentRouter = Router();

paymentRouter.use(authenticate);

paymentRouter.use(authorize("Customer"));

paymentRouter.post('/initiate', inititatePayment);

paymentRouter.post('/verify', verifyPayment);

paymentRouter.get('/:orderId', getPaymentDetails);

export {paymentRouter}