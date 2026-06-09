import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catch.async.ts";
import cartService from "./cart.service.ts";

// Helper function to safely convert to BigInt
function toBigInt(value: string | number | bigint | null | undefined): bigint {
  if (!value) throw new Error("Invalid ID");
  return BigInt(value);
}

const getCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ status: "error", message: "Unauthorized: User not authenticated" });
  }
  
  const cart = await cartService.getCart(toBigInt(req.user.id));
  return res.status(200).json({ status: "success", data: { cart } });
});

const addItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  
  const cart = await cartService.addItem(toBigInt(req.user.id), {
    ...req.body,
    restaurantBranchId: BigInt(req.body.restaurantBranchId),
    menuItemId: BigInt(req.body.menuItemId),
    modifiers: req.body.modifiers?.map((m: any) => ({
      modifierOptionId: BigInt(m.modifierOptionId),
    })),
  });
  return res.status(201).json({ status: "success", data: { cart } });
});

const updateItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  
  if (!req.params.itemId || Array.isArray(req.params.itemId)) {
    return res.status(400).json({ status: "error", message: "Invalid item ID" });
  }
  
  const cart = await cartService.updateItem(
    toBigInt(req.user.id),
    toBigInt(req.params.itemId),
    req.body
  );
  return res.status(200).json({ status: "success", data: { cart } });
});

const removeItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  
  if (!req.params.itemId || Array.isArray(req.params.itemId)) {
    return res.status(400).json({ status: "error", message: "Invalid item ID" });
  }
  
  await cartService.removeItem(toBigInt(req.user.id), toBigInt(req.params.itemId));
  return res.status(200).json({ status: "success", data: null });
});

const clearCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  
  await cartService.clearCart(toBigInt(req.user.id));
  return res.status(200).json({ status: "success", data: null });
});

const getPriceBreakdown = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  
  const breakdown = await cartService.getPriceBreakdown(toBigInt(req.user.id));
  return res.status(200).json({ status: "success", data: { breakdown } });
});

export default { getCart, addItem, updateItem, removeItem, clearCart, getPriceBreakdown };