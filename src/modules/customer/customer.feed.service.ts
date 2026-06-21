import { prisma } from '../../config/prisma.ts';

export async function getPersonalizedFeed(customerId: number) {
  // 1. Order Again: Restaurants customer has ordered from before
  const pastOrders = await prisma.order.findMany({
    where: { customerUserId: BigInt(customerId) },
    select: { branchId: true },
    distinct: ['branchId'],
    take: 10
  });
  
  const orderAgainBranchIds = pastOrders.map(o => o.branchId);
  const orderAgain = await prisma.restaurantBranch.findMany({
    where: { id: { in: orderAgainBranchIds } },
    include: { restaurant: true },
    take: 10
  });

  // 2. Trending This Week: Highest order volume recently
  // Mocking by using recent creation for now, as we don't have aggregated fields
  const trending = await prisma.restaurantBranch.findMany({
    orderBy: { createdAt: 'desc' },
    include: { restaurant: true },
    take: 10
  });

  // 3. Top Picks: High ratings
  // Mocking by just getting active branches, as averageRating doesn't exist on branch
  const topPicks = await prisma.restaurantBranch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { restaurant: true },
    take: 10
  });

  return {
    orderAgain,
    trending,
    topPicks
  };
}
