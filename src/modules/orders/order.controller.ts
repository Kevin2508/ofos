import { Request, Response } from "express";
import orderService from "./order.service.ts";
import { AuthenticatedRequest, GetOrdersQuery } from "./order.interface.ts";

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