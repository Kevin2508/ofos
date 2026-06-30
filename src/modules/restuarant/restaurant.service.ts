import restaurantRepository from './restaurant.repository.ts';
import { GetRestaurantsQuery } from './restaurant.interface.ts';

import { findAllCoupons } from '../coupon/coupons.repository.ts';

export const getRestaurants = async (filters: GetRestaurantsQuery) => {
  const restaurants = await restaurantRepository.getRestaurants(filters);

  const total = await restaurantRepository.countRestaurants(filters);

  const allCoupons = await findAllCoupons();
  const now = new Date();
  const activeCoupons = allCoupons.filter(c => c.isActive && c.validFrom <= now && c.validUntil >= now);

  const data = await Promise.all(restaurants.map(async (restaurant) => {
    const ratings = restaurant.reviews.map((review) =>
      Number(review.overallRating)
    );

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    return {
      id: restaurant.id.toString(),
      businessName: restaurant.businessName,
      description: restaurant.description,
      logoUrl: restaurant.logoUrl,
      coverImageUrl: restaurant.coverImageUrl,

      totalBranches: restaurant.branches.length,
      branches: restaurant.branches.map(b => ({
        ...b,
        id: b.id.toString(),
        restaurantId: b.restaurantId.toString()
      })),

      averageRating: Number(averageRating.toFixed(1)),

      createdAt: restaurant.createdAt,
      applicableCoupons: activeCoupons.filter(c => 
        !c.couponRestaurants.length || c.couponRestaurants.some(cr => String(cr.restaurantId) === String(restaurant.id))
      ).map(c => ({
        code: c.code,
        description: c.couponType === 'PERCENTAGE' ? `${c.value}% OFF` : c.couponType === 'FLAT' ? `₹${c.value} OFF` : c.couponType === 'FREE_DELIVERY' ? 'Free Delivery' : 'Buy 1 Get 1 Free'
      }))
    };
  }));

  return {
    total,
    page: Number(filters.page || 1),
    limit: Number(filters.limit || 10),
    data,
  };
};

export const getGlobalMenuItems = async (filters: any) => {
  const items = await restaurantRepository.getGlobalMenuItems(filters);
  const total = await restaurantRepository.countGlobalMenuItems(filters);
  return {
    total,
    data: items
  };
};

export const getRestaurantDetails = async (id: string) => {
  const restaurant = await restaurantRepository.getRestaurantById(BigInt(id));

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  const ratings = restaurant.reviews.map((review) =>
    Number(review.overallRating)
  );

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  return {
    id: restaurant.id.toString(),
    businessName: restaurant.businessName,
    legalBusinessName: restaurant.legalBusinessName,

    description: restaurant.description,

    logoUrl: restaurant.logoUrl,
    coverImageUrl: restaurant.coverImageUrl,

    primaryPhone: restaurant.primaryPhone,
    primaryEmail: restaurant.primaryEmail,

    averageRating: Number(averageRating.toFixed(1)),

    totalReviews: restaurant.reviews.length,

    branches: restaurant.branches,
    applicableCoupons: await (async () => {
      const allCoupons = await findAllCoupons();
      const now = new Date();
      return allCoupons.filter(c => {
        if (!c.isActive) return false;
        if (c.validFrom > now || c.validUntil < now) return false;
        if (c.couponRestaurants && c.couponRestaurants.length > 0) {
           return c.couponRestaurants.some(cr => String(cr.restaurantId) === String(restaurant.id));
        }
        return true;
      }).map(c => ({
        code: c.code,
        couponType: c.couponType,
        value: Number(c.value),
        description: c.couponType === 'PERCENTAGE' ? `${c.value}% OFF` : c.couponType === 'FLAT' ? `₹${c.value} OFF` : c.couponType === 'FREE_DELIVERY' ? 'Free Delivery' : 'Buy 1 Get 1 Free'
      }));
    })()
  };
};

export const getRestaurantMenu = async (restaurantId: string) => {
  const categories = await restaurantRepository.getRestaurantMenu(
    BigInt(restaurantId)
  );

  return {
    restaurantId,
    categories: categories.map((category) => ({
      id: category.id.toString(),
      name: category.name,
      description: category.description,

      items: category.menuItems.map((item) => ({
        id: item.id.toString(),

        sku: item.sku,

        name: item.name,

        description: item.description,

        imageUrl: item.imageUrl,

        basePrice: Number(item.basePrice),

        foodType: item.foodType,

        isBestseller: item.isBestseller,

        images: item.images,

        availability: item.availability,

        modifierGroups: item.modifierGroups.map((group) => ({
          id: group.modifierGroup.id.toString(),

          name: group.modifierGroup.name,

          isRequired: group.modifierGroup.isRequired,

          minSelection: group.modifierGroup.minSelection,

          maxSelection: group.modifierGroup.maxSelection,

          options: group.modifierGroup.options,
        })),
      })),
    })),
  };
};

export async function getFeaturedRestaurants(userId?: string) {
  const topPicks = await restaurantRepository.getTopPickRestaurants();

  const trending = await restaurantRepository.getTrendingRestaurants();

  let orderAgain: any[] = [];

  if (userId) {
    orderAgain = await restaurantRepository.getOrderAgainRestaurants(
      BigInt(userId)
    );
  }

  return {
    topPicks: topPicks
      .map((restaurant) => {
        const ratings = restaurant.reviews.map((review) =>
          Number(review.overallRating)
        );

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        return {
          id: restaurant.id.toString(),
          businessName: restaurant.businessName,
          logoUrl: restaurant.logoUrl,
          averageRating: Number(averageRating.toFixed(1)),
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10),

    trending: trending
      .map((restaurant) => ({
        id: restaurant.id.toString(),
        businessName: restaurant.businessName,
        logoUrl: restaurant.logoUrl,
        totalOrders: restaurant.orders.length,
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10),

    orderAgain: orderAgain.map((order) => ({
      id: order.restaurant.id.toString(),
      businessName: order.restaurant.businessName,
      logoUrl: order.restaurant.logoUrl,
    })),
  };
}

export const getBranchDetails = async (id: string) => {
  const branch = await restaurantRepository.getBranchById(BigInt(id));

  if (!branch) {
    throw new Error('Branch not found');
  }

  // Formatting id properly for BigInt to string mappings
  return {
    ...branch,
    id: branch.id.toString(),
    restaurantId: branch.restaurantId.toString(),
    restaurant: {
      ...branch.restaurant,
      id: branch.restaurant.id.toString(),
    }
  };
};

export const getBranchMenu = async (branchId: string) => {
  const categories = await restaurantRepository.getBranchMenu(BigInt(branchId));

  return categories.map((category) => ({
    id: category.id.toString(),
    name: category.name,
    description: category.description,
    menuItems: category.menuItems.map(item => ({
      ...item,
      id: item.id.toString(),
      categoryId: item.categoryId.toString(),
      basePrice: item.basePrice.toString()
    }))
  }));
};
