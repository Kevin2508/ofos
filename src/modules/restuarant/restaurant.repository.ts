import { prisma } from '../../config/prisma.ts';
import { GetRestaurantsQuery } from './restaurant.interface.ts';


  async function getRestaurants(filters: GetRestaurantsQuery) {
const page = Number(filters.page) || 1;
const limit = Number(filters.limit) || 10;

const { search, city, foodType } = filters;

    const skip = (page - 1) * limit;

    return prisma.restaurant.findMany({
      where: {
        status: "APPROVED",

        ...(search && {
          OR: [
            {
              businessName: {
                contains: search,
              },
            },
            {
              description: {
                contains: search,
              },
            },
          ],
        }),

        ...(city && {
          branches: {
            some: {
              city,
            },
          },
        }),

        ...(foodType && {
          branches: {
            some: {
              menuCategories: {
                some: {
                  menuItems: {
                    some: {
                      foodType,
                    },
                  },
                },
              },
            },
          },
        }),
      },

      include: {
        branches: true,

        reviews: {
          select: {
            overallRating: true,
          },
        },
      },

      skip,
      take: limit,

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async function countRestaurants(filters: GetRestaurantsQuery) {
    const { search, city, foodType } = filters;
    return prisma.restaurant.count({
      where: {
        status: "APPROVED",

        ...(search && {
          OR: [
            {
              businessName: {
                contains: search,
              },
            },
            {
              description: {
                contains: search,
              },
            },
          ],
        }),

        ...(city && {
          branches: {
            some: {
              city,
            },
          },
        }),

        ...(foodType && {
          branches: {
            some: {
              menuCategories: {
                some: {
                  menuItems: {
                    some: {
                      foodType,
                    },
                  },
                },
              },
            },
          },
        }),
      },
    });
  }

  async function getRestaurantById(id: bigint) {
  return prisma.restaurant.findFirst({
    where: {
      id,
      status: "APPROVED",
    },

    include: {
      branches: {
        include: {
          operatingHours: true,
          deliveryZone: true,
        },
      },

      reviews: {
        select: {
          overallRating: true,
        },
      },
    },
  });
}

async function getRestaurantMenu(
  restaurantId: bigint
) {
  return prisma.menuCategory.findMany({
    where: {
      branch: {
        restaurantId,
      },

      isActive: true,
    },

    include: {
      menuItems: {
        where: {
          isAvailable: true,
        },

        include: {
          images: true,

          availability: true,

          modifierGroups: {
            include: {
              modifierGroup: {
                include: {
                  options: true,
                },
              },
            },
          },
        },
      },
    },

    orderBy: {
      displayOrder: "asc",
    },
  });
}

export async function getTopPickRestaurants() {
  return prisma.restaurant.findMany({
    where: {
      status: "APPROVED",
    },

    include: {
      reviews: {
        select: {
          overallRating: true,
        },
      },
    },
  });
}

async function getTrendingRestaurants() {
  return prisma.restaurant.findMany({
    where: {
      status: "APPROVED",
    },

    include: {
      orders: {
        select: {
          id: true,
        },
      },
    },
  });
}

async function getOrderAgainRestaurants(
  userId: bigint
) {
  return prisma.order.findMany({
    where: {
      customerUserId: userId,
    },

    include: {
      restaurant: true,
    },

    distinct: ["restaurantId"],

    orderBy: {
      createdAt: "desc",
    },
  });
}

export default {
  getRestaurants,
  countRestaurants,
    getRestaurantById,
    getRestaurantMenu,
    getTopPickRestaurants,
    getTrendingRestaurants,
    getOrderAgainRestaurants,
};