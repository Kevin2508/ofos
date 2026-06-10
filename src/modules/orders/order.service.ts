import orderRepository from "./order.repository.ts";

async function getOrders(
  customerUserId: bigint,
  page: number,
  limit: number
) {
  const [orders, total] = await Promise.all([
    orderRepository.getOrders({
      customerUserId,
      page,
      limit,
    }),

    orderRepository.countOrders(customerUserId),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default {
  getOrders,
};