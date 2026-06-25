import { prisma } from '../../config/prisma.ts';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function searchRestaurantsAndDishes(query: string, filters: any, sort: any, userLat?: number, userLon?: number) {
  const where: any = { isActive: true };

  if (query) {
    where.OR = [
      { branchName: { contains: query } },
      { restaurant: { businessName: { contains: query } } },
      { restaurant: { cuisineTags: { contains: query } } },
      { menuCategories: { some: { menuItems: { some: { name: { contains: query } } } } } }
    ];
  }

  // Filters
  if (filters.cuisine) {
    where.restaurant = { ...where.restaurant, cuisineTags: { contains: filters.cuisine } };
  }

  const branches = await prisma.restaurantBranch.findMany({
    where,
    include: {
      restaurant: {
        include: {
          reviews: { select: { overallRating: true } }
        }
      },
      operatingHours: true,
      _count: {
        select: { orders: true }
      }
    }
  });

  const results = branches.map(branch => {
    let textRelevance = 0;
    if (query) {
      const q = query.toLowerCase();
      if (branch.branchName.toLowerCase().includes(q)) textRelevance += 10;
      if (branch.restaurant.businessName.toLowerCase().includes(q)) textRelevance += 15;
      if (branch.restaurant.cuisineTags?.toLowerCase().includes(q)) textRelevance += 5;
    } else {
      textRelevance = 5;
    }

    const orderVolume = branch._count.orders;
    const avgRating = branch.restaurant.reviews.length 
      ? branch.restaurant.reviews.reduce((acc, rev) => acc + Number(rev.overallRating), 0) / branch.restaurant.reviews.length
      : 3.0; 

    let proximityScore = 10;
    if (userLat !== undefined && userLon !== undefined) {
      const dist = calculateDistance(userLat, userLon, Number(branch.latitude), Number(branch.longitude));
      proximityScore = Math.max(0, 10 - dist); // 1 point per km up to 10km
    }

    const isOpenScore = branch.isAcceptingOrders ? 20 : 0;

    // Composite score: text relevance + rating (weighted) + volume + proximity + open status
    const compositeScore = textRelevance + (avgRating * 2) + (Math.min(orderVolume, 100) * 0.1) + proximityScore + isOpenScore;

    return {
      ...branch,
      compositeScore,
      avgRating,
      orderVolume
    };
  });

  if (sort === 'SCORE' || !sort) {
    results.sort((a, b) => b.compositeScore - a.compositeScore);
  } else if (sort === 'RATING') {
    results.sort((a, b) => b.avgRating - a.avgRating);
  } else if (sort === 'DELIVERY_TIME') {
    results.sort((a, b) => b.compositeScore - a.compositeScore); 
  }

  return results.slice(0, 20);
}

export async function getSearchSuggestions(query: string, customerId?: bigint) {
  if (!query || query.length < 2) return [];

  const suggestions: string[] = [];

  const popularBranches = await prisma.restaurantBranch.findMany({
    where: {
      OR: [
        { branchName: { startsWith: query } },
        { restaurant: { businessName: { startsWith: query } } }
      ]
    },
    orderBy: {
      orders: { _count: 'desc' }
    },
    take: 3,
    include: { restaurant: true }
  });

  popularBranches.forEach(b => {
    if (!suggestions.includes(b.restaurant.businessName)) {
      suggestions.push(b.restaurant.businessName);
    }
  });

  if (customerId) {
    const pastOrders = await prisma.orderItem.findMany({
      where: {
        order: { customerUserId: customerId },
        itemName: { contains: query }
      },
      distinct: ['itemName'],
      take: 2,
      select: { itemName: true }
    });

    pastOrders.forEach(o => {
      if (!suggestions.includes(o.itemName)) {
        suggestions.push(o.itemName);
      }
    });
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { name: { contains: query } },
    distinct: ['name'],
    take: 3,
    select: { name: true }
  });
  
  menuItems.forEach(m => {
    if (!suggestions.includes(m.name)) {
      suggestions.push(m.name);
    }
  });

  return suggestions.slice(0, 5);
}
