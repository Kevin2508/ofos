interface ICart {
  id: bigint;
  customerUserId: bigint;
  restaurantBranchId: bigint;
  status: string;
  subtotalAmount: string;
  totalAmount: string;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export { ICart };