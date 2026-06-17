import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.ts";
import { createRefund,getRefundByOrderId, getAllRefunds,
         changeRefundStatus  
 } from "./refund.controller.ts";

const refundRouter = Router();

refundRouter.use(authenticate);

refundRouter.use(authorize('Admin'));

refundRouter.post('/',createRefund);

refundRouter.get( '/:orderId',getRefundByOrderId);

refundRouter.get('/', getAllRefunds);

refundRouter.patch('/:refundId/status', changeRefundStatus);
export {refundRouter}