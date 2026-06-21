import { prisma } from '../../config/prisma.ts';

export async function searchRestaurantsAndDishes(query: string, filters: any, sort: any) {
  // Base query
  const where: any = {
    isClosed: false
  };

  if (query) {
    where.OR = [
      { restaurant: { name: { contains: query } } },
      { restaurant: { primaryCuisine: { contains: query } } }
    ];
  }

  // Filters
  if (filters.cuisine) {
    where.restaurant = { ...where.restaurant, primaryCuisine: filters.cuisine };
  }
  
  if (filters.rating) {
    // Mocking: We don't have averageRating in the schema, so we skip filtering by it for now.
  }

  // Dietary filters handled by filtering menu items in the branch, but to keep simple we return branches
  
  // Sorting
  let orderBy: any = {};
  if (sort === 'RATING') orderBy = { createdAt: 'desc' }; // Mock fallback
  else if (sort === 'DELIVERY_TIME') orderBy = { createdAt: 'desc' }; // Simplified
  else if (sort === 'PRICE_LOW') orderBy = { minimumOrderValue: 'asc' };
  else if (sort === 'PRICE_HIGH') orderBy = { minimumOrderValue: 'desc' };
  else orderBy = { createdAt: 'desc' }; // default Relevance

  const results = await prisma.restaurantBranch.findMany({
    where,
    orderBy,
    include: {
      restaurant: true,
      operatingHours: true,
    },
    take: 20
  });

  return results;
}
