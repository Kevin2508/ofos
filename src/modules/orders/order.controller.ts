import { NextFunction, Request, Response } from "express";
import orderService, {
  placeOrder,
  acceptOrder,
  rejectOrder,
  markPreparing,
  markReadyForPickup,
  reorderPastOrder,
} from "./order.service.ts";
import { AuthenticatedRequest, GetOrdersQuery, OrderParams, CancelOrderBody } from "./order.interface.ts";
// import {User} from "../../types/express.d.ts";

export async function getOrders(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const customerUserId = BigInt(req.user!.id);

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

export async function getRestaurantOrders(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const ownerUserId = BigInt(req.user!.id);
    const query = req.query as GetOrdersQuery;
    
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;
    const date = query.date as string | undefined;
    const payment = query.payment as string | undefined;

    const data = await orderService.getRestaurantOrders(
      ownerUserId,
      page,
      limit,
      status,
      search,
      date,
      payment
    );

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant orders",
    });
  }
}

export async function getOrderDetails(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const customerUserId = BigInt(req.user!.id);
    const orderParams = req.params as OrderParams;
    const orderId = BigInt(orderParams.id);

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

export async function getRestaurantOrderDetails(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const ownerUserId = BigInt(req.user!.id);
    const orderParams = req.params as OrderParams;
    const orderId = BigInt(orderParams.id);

    const order = await orderService.getRestaurantOrderDetails(
      orderId,
      ownerUserId
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(500).json({ success: false, message: "Failed to fetch order details" });
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
          "Order can only be cancelled before it is out for delivery",
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

export const staffAcceptOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffUserId = BigInt((req.user as any).id);
    const orderId = BigInt((req.params as any).id as string);
    const order = await acceptOrder(orderId, staffUserId);
    res.status(200).json({ success: true, message: 'Order accepted', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept order' });
  }
};

export const staffRejectOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffUserId = BigInt((req.user as any).id);
    const orderId = BigInt((req.params as any).id as string);
    const { reason } = req.body as any;
    const order = await rejectOrder(orderId, staffUserId, reason || 'Rejected by staff');
    res.status(200).json({ success: true, message: 'Order rejected', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject order' });
  }
};

export const staffMarkPreparing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffUserId = BigInt((req.user as any).id);
    const orderId = BigInt((req.params as any).id as string);
    const order = await markPreparing(orderId, staffUserId);
    res.status(200).json({ success: true, message: 'Order is preparing', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark preparing' });
  }
};

export const staffMarkReady = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffUserId = BigInt((req.user as any).id);
    const orderId = BigInt((req.params as any).id as string);
    const order = await markReadyForPickup(orderId, staffUserId);
    res.status(200).json({ success: true, message: 'Order is ready for pickup', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark ready' });
  }
};

export const staffMarkItemUnavailable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffUserId = BigInt((req.user as any).id);
    const orderId = BigInt((req.params as any).id);
    const itemId = BigInt((req.params as any).itemId);
    const order = await orderService.markItemUnavailable(orderId, itemId, staffUserId);
    res.status(200).json({ success: true, message: 'Item marked as unavailable and refund initiated', data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to mark item unavailable' });
  }
};

export const reorderPastOrderController = async (req: Request, res: Response) => {
  try {
    const customerUserId = BigInt((req as any).user.id);
    const orderId = BigInt((req.params as any).id as string);
    const { forceClear } = req.body as any;

    const result = await reorderPastOrder(orderId, customerUserId, forceClear);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const raiseDisputeController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerUserId = BigInt(req.user!.id);
    const orderId = BigInt((req.params as any).id as string);
    const { category, description } = req.body as any;

    const ticket = await orderService.raiseDispute(orderId, customerUserId, category, description);
    
    return res.status(201).json({
      success: true,
      message: 'Dispute raised successfully. A support ticket has been generated.',
      data: ticket
    });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (error.message === 'INVALID_CATEGORY') {
      return res.status(400).json({ success: false, message: 'Invalid dispute category' });
    }
    return res.status(500).json({ success: false, message: 'Failed to raise dispute' });
  }
};
