import restaurantRepository from './restaurant.repository.ts';
import { GetRestaurantsQuery } from './restaurant.interface.ts';
import { RestaurantListDto } from './restaurant.dto.ts';

export const getRestaurants = async (filters: GetRestaurantsQuery) => {
  const restaurants = await restaurantRepository.getRestaurants(filters);
  //   console.log(restaurants);

  const total = await restaurantRepository.countRestaurants(filters);

  const data = restaurants.map((restaurant) => {
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

      averageRating: Number(averageRating.toFixed(1)),

      createdAt: restaurant.createdAt,
    };
  });

  return {
    total,
    page: Number(filters.page || 1),
    limit: Number(filters.limit || 10),
    data,
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
}

export async function getFeaturedRestaurants(
  userId?: string
) {
  const topPicks =
    await restaurantRepository.getTopPickRestaurants();

  const trending =
    await restaurantRepository.getTrendingRestaurants();

  let orderAgain: any[] = [];

  if (userId) {
    orderAgain =
      await restaurantRepository.getOrderAgainRestaurants(
        BigInt(userId)
      );
  }

  return {
    topPicks: topPicks
      .map((restaurant) => {
        const ratings =
          restaurant.reviews.map((review) =>
            Number(review.overallRating)
          );

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) /
              ratings.length
            : 0;

        return {
          id: restaurant.id.toString(),
          businessName:
            restaurant.businessName,
          logoUrl: restaurant.logoUrl,
          averageRating: Number(
            averageRating.toFixed(1)
          ),
        };
      })
      .sort(
        (a, b) =>
          b.averageRating - a.averageRating
      )
      .slice(0, 10),

    trending: trending
      .map((restaurant) => ({
        id: restaurant.id.toString(),
        businessName:
          restaurant.businessName,
        logoUrl: restaurant.logoUrl,
        totalOrders:
          restaurant.orders.length,
      }))
      .sort(
        (a, b) =>
          b.totalOrders - a.totalOrders
      )
      .slice(0, 10),

    orderAgain: orderAgain.map((order) => ({
      id: order.restaurant.id.toString(),
      businessName:
        order.restaurant.businessName,
      logoUrl:
        order.restaurant.logoUrl,
    })),
  };
}
