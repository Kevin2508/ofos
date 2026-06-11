import { NextFunction, Request, Response } from "express";
import orderService, { placeOrder } from "./order.service.ts";
import { AuthenticatedRequest, GetOrdersQuery , OrderParams,CancelOrderBody } from "./order.interface.ts";
// import {User} from "../../types/express.d.ts";

export async function getOrders(
  req: AuthenticatedRequest,
  res: Response
) {
  console.log(req.user)
  try {
  const customerUserId = BigInt(req.user!.id);
  console.log("Authenticated user ID:", customerUserId); 

const query = req.query as GetOrdersQuery;

const page = Number(query.page) || 1;
const limit = Number(query.limit) || 10;

    const data = await orderService.getOrders(
      customerUserId,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
}

export async function getOrderDetails(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const customerUserId = BigInt(req.user!.id);
// console.log(customerUserId)  
    const orderParams = req.params as OrderParams;
    const orderId = BigInt(orderParams.id);
    console.log(orderId)

    const order =
      await orderService.getOrderDetails(
        orderId,
        customerUserId
      );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "ORDER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
    });
  }
}

export async function getOrderTracking(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const customerUserId = BigInt(req.user!.id);

   const orderParams = req.params as OrderParams;
    const orderId = BigInt(orderParams.id);

    const tracking =
      await orderService.getOrderTracking(
        orderId,
        customerUserId
      );

    return res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "ORDER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tracking",
    });
  }
}

export async function cancelOrder(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const customerUserId = BigInt(req.user!.id);
    console.log(customerUserId)

      const orderParams = req.params as OrderParams;
    const orderId = BigInt(orderParams.id);

    const { reason } = req.body as CancelOrderBody;

    const order =
      await orderService.cancelOrder(
        orderId,
        customerUserId,
        reason
      );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "ORDER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "ORDER_CANNOT_BE_CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order can only be cancelled before acceptance",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
}

export const placeOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerUserId = BigInt((req as any).user.id);
 
    const { checkoutSessionId, specialInstructions } = req.body;

    const result = await placeOrder(customerUserId, {
      checkoutSessionId: BigInt(checkoutSessionId),
      specialInstructions,
    });
 
    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: {
        order: {
          orderId: result.orderId.toString(),
          orderNumber: result.orderNumber,
          orderStatus: result.orderStatus,
          paymentStatus: result.paymentStatus,
          subtotalAmount: result.subtotalAmount,
          deliveryFee: result.deliveryFee,
          taxAmount: result.taxAmount,
          totalAmount: result.totalAmount,
          deliveryType: result.deliveryType,
          scheduledFor: result.scheduledFor
            ? result.scheduledFor.toISOString()
            : null,
          estimatedDeliveryAt: result.estimatedDeliveryAt
            ? result.estimatedDeliveryAt.toISOString()
            : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
