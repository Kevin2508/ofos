import { prisma } from "../../config/prisma.ts";

interface GetOrdersParams {
  customerUserId: bigint;
  page: number;
  limit: number;
}

async function getOrders({
  customerUserId,
  page,
  limit,
}: GetOrdersParams) {
  const skip = (page - 1) * limit;

  return prisma.order.findMany({
    where: {
      customerUserId,
    },

    include: {
      restaurant: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
        },
      },

      branch: {
        select: {
          id: true,
          branchName: true,
          city: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    skip,
    take: limit,
  });
}

async function countOrders(customerUserId: bigint) {
  return prisma.order.count({
    where: {
      customerUserId,
    },
  });
}

export default {
  getOrders,
  countOrders,
};