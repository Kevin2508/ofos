import { Router } from "express";
import { inititatePayment } from "./payment.controller.ts";
const paymentRouter = Router();

paymentRouter.post('/initiate', inititatePayment)

export {paymentRouter}