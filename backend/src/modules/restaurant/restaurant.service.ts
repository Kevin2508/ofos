import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RestaurantStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GetRestaurantsQueryDto, SearchQueryDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  private calculateAverageRating(reviews: Array<{ overallRating: any }>): number {
    if (!reviews || reviews.length === 0) return 0; // Return 0.0 for unreviewed restaurants
    const sum = reviews.reduce((acc, r) => acc + Number(r.overallRating), 0);
    return Number((sum / reviews.length).toFixed(1));
  }

  // -------------------------------------------------------------
  // Restaurant Listing & Discovery
  // -------------------------------------------------------------
  async getRestaurants(filters: GetRestaurantsQueryDto) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.RestaurantWhereInput = {
      status: RestaurantStatus.APPROVED,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { cuisineTags: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.cuisine && filters.cuisine !== 'All') {
      where.cuisineTags = { contains: filters.cuisine, mode: 'insensitive' };
    }

    if (filters.city) {
      where.branches = {
        some: {
          city: { equals: filters.city, mode: 'insensitive' },
          isActive: true,
          deletedAt: null,
        },
      };
    }

    // If minRating is requested, fetch matching candidates and filter by computed rating
    if (filters.minRating && filters.minRating > 0) {
      const candidates = await this.prisma.restaurant.findMany({
        where,
        include: {
          branches: {
            where: { isActive: true, deletedAt: null },
            include: { deliveryZone: true },
          },
          reviews: {
            where: { isHidden: false },
            select: { overallRating: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = candidates.map((r) => {
        const averageRating = this.calculateAverageRating(r.reviews);
        return {
          id: r.id.toString(),
          businessName: r.businessName,
          description: r.description,
          logoUrl: r.logoUrl,
          coverImageUrl: r.coverImageUrl,
          cuisineTags: r.cuisineTags ? r.cuisineTags.split(',').map((t) => t.trim()) : [],
          averageRating,
          totalReviews: r.reviews.length,
          totalBranches: r.branches.length,
          branches: r.branches.map((b) => ({
            id: b.id.toString(),
            branchName: b.branchName,
            addressLine1: b.addressLine1,
            city: b.city,
            deliveryFee: Number(b.deliveryFee),
            minimumOrderValue: Number(b.minimumOrderValue),
            isAcceptingOrders: b.isAcceptingOrders,
            deliveryZone: b.deliveryZone
              ? {
                  radiusKm: Number(b.deliveryZone.radiusKm),
                  minMinutes: b.deliveryZone.minimumDeliveryTimeMinutes,
                  maxMinutes: b.deliveryZone.maximumDeliveryTimeMinutes,
                }
              : null,
          })),
        };
      });

      const filtered = formatted.filter((r) => r.averageRating >= filters.minRating!);
      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / limit) || 1;
      const pageData = filtered.slice(skip, skip + limit);

      return {
        total: totalCount,
        page,
        limit,
        totalPages,
        data: pageData,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    }

    const [total, restaurants] = await Promise.all([
      this.prisma.restaurant.count({ where }),
      this.prisma.restaurant.findMany({
        where,
        include: {
          branches: {
            where: { isActive: true, deletedAt: null },
            include: {
              deliveryZone: true,
            },
          },
          reviews: {
            where: { isHidden: false },
            select: { overallRating: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data = restaurants.map((r) => {
      const averageRating = this.calculateAverageRating(r.reviews);
      return {
        id: r.id.toString(),
        businessName: r.businessName,
        description: r.description,
        logoUrl: r.logoUrl,
        coverImageUrl: r.coverImageUrl,
        cuisineTags: r.cuisineTags ? r.cuisineTags.split(',').map((t) => t.trim()) : [],
        averageRating,
        totalReviews: r.reviews.length,
        totalBranches: r.branches.length,
        branches: r.branches.map((b) => ({
          id: b.id.toString(),
          branchName: b.branchName,
          addressLine1: b.addressLine1,
          city: b.city,
          deliveryFee: Number(b.deliveryFee),
          minimumOrderValue: Number(b.minimumOrderValue),
          isAcceptingOrders: b.isAcceptingOrders,
          deliveryZone: b.deliveryZone
            ? {
                radiusKm: Number(b.deliveryZone.radiusKm),
                minMinutes: b.deliveryZone.minimumDeliveryTimeMinutes,
                maxMinutes: b.deliveryZone.maximumDeliveryTimeMinutes,
              }
            : null,
        })),
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      total,
      page,
      limit,
      totalPages,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getFeaturedRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { status: RestaurantStatus.APPROVED, deletedAt: null },
      include: {
        branches: {
          where: { isActive: true },
          include: { deliveryZone: true },
        },
        reviews: {
          where: { isHidden: false },
          select: { overallRating: true },
        },
      },
      take: 6,
    });

    const formatted = restaurants.map((r) => ({
      id: r.id.toString(),
      businessName: r.businessName,
      description: r.description,
      logoUrl: r.logoUrl,
      coverImageUrl: r.coverImageUrl,
      cuisineTags: r.cuisineTags ? r.cuisineTags.split(',').map((t) => t.trim()) : [],
      averageRating: this.calculateAverageRating(r.reviews),
      totalReviews: r.reviews.length,
      primaryBranch: r.branches[0]
        ? {
            id: r.branches[0].id.toString(),
            branchName: r.branches[0].branchName,
            city: r.branches[0].city,
            deliveryFee: Number(r.branches[0].deliveryFee),
            estimatedTime: r.branches[0].deliveryZone
              ? `${r.branches[0].deliveryZone.minimumDeliveryTimeMinutes}-${r.branches[0].deliveryZone.maximumDeliveryTimeMinutes} mins`
              : '30-40 mins',
          }
        : null,
    }));

    return {
      topPicks: formatted,
      trending: formatted.slice().reverse(),
    };
  }

  // -------------------------------------------------------------
  // Restaurant Details & Menu
  // -------------------------------------------------------------
  async getRestaurantById(id: bigint) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: {
          where: { isActive: true },
          include: {
            deliveryZone: true,
            operatingHours: true,
          },
        },
        reviews: {
          where: { isHidden: false },
          select: { overallRating: true },
        },
      },
    });

    if (!restaurant || restaurant.status !== RestaurantStatus.APPROVED || restaurant.deletedAt) {
      throw new NotFoundException('Restaurant not found or inactive');
    }

    return {
      id: restaurant.id.toString(),
      businessName: restaurant.businessName,
      legalBusinessName: restaurant.legalBusinessName,
      description: restaurant.description,
      logoUrl: restaurant.logoUrl,
      coverImageUrl: restaurant.coverImageUrl,
      primaryPhone: restaurant.primaryPhone,
      primaryEmail: restaurant.primaryEmail,
      cuisineTags: restaurant.cuisineTags ? restaurant.cuisineTags.split(',').map((t) => t.trim()) : [],
      averageRating: this.calculateAverageRating(restaurant.reviews),
      totalReviews: restaurant.reviews.length,
      branches: restaurant.branches.map((b) => ({
        id: b.id.toString(),
        branchName: b.branchName,
        addressLine1: b.addressLine1,
        city: b.city,
        state: b.state,
        postalCode: b.postalCode,
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
        deliveryFee: Number(b.deliveryFee),
        minimumOrderValue: Number(b.minimumOrderValue),
        isAcceptingOrders: b.isAcceptingOrders,
        deliveryZone: b.deliveryZone
          ? {
              radiusKm: Number(b.deliveryZone.radiusKm),
              minMinutes: b.deliveryZone.minimumDeliveryTimeMinutes,
              maxMinutes: b.deliveryZone.maximumDeliveryTimeMinutes,
            }
          : null,
        operatingHours: b.operatingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          isClosed: h.isClosed,
        })),
      })),
    };
  }

  async getRestaurantMenu(restaurantId: bigint) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        status: RestaurantStatus.APPROVED,
        deletedAt: null,
      },
      include: {
        branches: {
          where: { isActive: true, deletedAt: null },
          take: 1,
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or not approved');
    }

    const branch = restaurant.branches[0];
    if (!branch) {
      return { restaurantId: restaurantId.toString(), categories: [] };
    }

    return this.getBranchMenu(branch.id);
  }

  async getBranchDetails(branchId: bigint) {
    const branch = await this.prisma.restaurantBranch.findFirst({
      where: {
        id: branchId,
        isActive: true,
        deletedAt: null,
        restaurant: {
          status: RestaurantStatus.APPROVED,
          deletedAt: null,
        },
      },
      include: {
        restaurant: true,
        deliveryZone: true,
        operatingHours: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found, inactive, or unapproved');
    }

    return {
      id: branch.id.toString(),
      restaurantId: branch.restaurantId.toString(),
      restaurantName: branch.restaurant.businessName,
      branchName: branch.branchName,
      addressLine1: branch.addressLine1,
      city: branch.city,
      state: branch.state,
      postalCode: branch.postalCode,
      contactPhone: branch.contactPhone,
      minimumOrderValue: Number(branch.minimumOrderValue),
      deliveryFee: Number(branch.deliveryFee),
      isAcceptingOrders: branch.isAcceptingOrders,
      deliveryZone: branch.deliveryZone
        ? {
            radiusKm: Number(branch.deliveryZone.radiusKm),
            minMinutes: branch.deliveryZone.minimumDeliveryTimeMinutes,
            maxMinutes: branch.deliveryZone.maximumDeliveryTimeMinutes,
          }
        : null,
      operatingHours: branch.operatingHours,
    };
  }

  async getBranchMenu(branchId: bigint) {
    // Assert branch is active and belongs to an approved, non-deleted restaurant
    const branch = await this.prisma.restaurantBranch.findFirst({
      where: {
        id: branchId,
        isActive: true,
        deletedAt: null,
        restaurant: {
          status: RestaurantStatus.APPROVED,
          deletedAt: null,
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found, inactive, or unapproved');
    }

    const categories = await this.prisma.menuCategory.findMany({
      where: { branchId, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        menuItems: {
          where: { deletedAt: null },
          include: {
            images: { orderBy: { displayOrder: 'asc' } },
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: {
                    options: { orderBy: { displayOrder: 'asc' } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      branchId: branchId.toString(),
      categories: categories.map((cat) => ({
        id: cat.id.toString(),
        name: cat.name,
        description: cat.description,
        items: cat.menuItems.map((item) => ({
          id: item.id.toString(),
          sku: item.sku,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          basePrice: Number(item.basePrice),
          foodType: item.foodType,
          isBestseller: item.isBestseller,
          isAvailable: item.isAvailable,
          images: item.images.map((img) => img.imageUrl),
          modifierGroups: item.modifierGroups.map((mg) => ({
            id: mg.modifierGroup.id.toString(),
            name: mg.modifierGroup.name,
            isRequired: mg.modifierGroup.isRequired,
            minSelection: mg.modifierGroup.minSelection,
            maxSelection: mg.modifierGroup.maxSelection,
            options: mg.modifierGroup.options.map((opt) => ({
              id: opt.id.toString(),
              optionName: opt.optionName,
              additionalPrice: Number(opt.additionalPrice),
            })),
          })),
        })),
      })),
    };
  }

  async getGlobalMenuItems(filters: { search?: string; foodType?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.MenuItemWhereInput = {
      deletedAt: null,
      isAvailable: true,
      category: {
        isActive: true,
        branch: {
          isActive: true,
          deletedAt: null,
          restaurant: { status: RestaurantStatus.APPROVED, deletedAt: null },
        },
      },
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.foodType) {
      where.foodType = filters.foodType as any;
    }

    const [total, items] = await Promise.all([
      this.prisma.menuItem.count({ where }),
      this.prisma.menuItem.findMany({
        where,
        include: {
          category: {
            include: {
              branch: {
                include: { restaurant: true },
              },
            },
          },
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: items.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        basePrice: Number(item.basePrice),
        foodType: item.foodType,
        isBestseller: item.isBestseller,
        restaurant: {
          id: item.category.branch.restaurant.id.toString(),
          name: item.category.branch.restaurant.businessName,
          branchId: item.category.branch.id.toString(),
          branchName: item.category.branch.branchName,
          city: item.category.branch.city,
        },
      })),
    };
  }

  // -------------------------------------------------------------
  // Customer Feed & Search
  // -------------------------------------------------------------
  async getFeed() {
    const featured = await this.getFeaturedRestaurants();
    const categories = [
      { id: 'cat-pizza', name: 'Pizza', icon: '🍕' },
      { id: 'cat-biryani', name: 'Biryani', icon: '🍲' },
      { id: 'cat-burgers', name: 'Burgers', icon: '🍔' },
      { id: 'cat-pasta', name: 'Pasta', icon: '🍝' },
      { id: 'cat-dessert', name: 'Desserts', icon: '🍰' },
    ];

    const popularDishes = await this.prisma.menuItem.findMany({
      where: {
        isBestseller: true,
        isAvailable: true,
        deletedAt: null,
        category: {
          isActive: true,
          branch: {
            isActive: true,
            deletedAt: null,
            restaurant: { status: RestaurantStatus.APPROVED, deletedAt: null },
          },
        },
      },
      include: {
        category: {
          include: {
            branch: {
              include: { restaurant: true },
            },
          },
        },
      },
      take: 6,
    });

    return {
      categories,
      topPicks: featured.topPicks,
      trending: featured.trending,
      popularDishes: popularDishes.map((d) => ({
        id: d.id.toString(),
        name: d.name,
        description: d.description,
        imageUrl: d.imageUrl,
        basePrice: Number(d.basePrice),
        foodType: d.foodType,
        restaurantName: d.category.branch.restaurant.businessName,
        branchId: d.category.branch.id.toString(),
      })),
    };
  }

  async search(queryDto: SearchQueryDto) {
    const query = (queryDto.query || '').trim();

    const restWhere: Prisma.RestaurantWhereInput = {
      status: RestaurantStatus.APPROVED,
      deletedAt: null,
    };

    if (query) {
      restWhere.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { cuisineTags: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (queryDto.cuisine && queryDto.cuisine !== 'All') {
      restWhere.cuisineTags = { contains: queryDto.cuisine, mode: 'insensitive' };
    }

    // Search restaurants
    const restaurants = await this.prisma.restaurant.findMany({
      where: restWhere,
      include: {
        branches: { where: { isActive: true, deletedAt: null }, take: 1 },
        reviews: { where: { isHidden: false }, select: { overallRating: true } },
      },
      take: 20,
    });

    let mappedRestaurants = restaurants.map((r) => ({
      id: r.id.toString(),
      name: r.businessName,
      description: r.description,
      logoUrl: r.logoUrl,
      cuisineTags: r.cuisineTags ? r.cuisineTags.split(',').map((t) => t.trim()) : [],
      averageRating: this.calculateAverageRating(r.reviews),
      totalReviews: r.reviews.length,
      branchId: r.branches[0]?.id.toString() || null,
      createdAt: r.createdAt,
    }));

    if (queryDto.rating) {
      mappedRestaurants = mappedRestaurants.filter((r) => r.averageRating >= queryDto.rating!);
    }

    if (queryDto.sort === 'rating') {
      mappedRestaurants.sort((a, b) => b.averageRating - a.averageRating);
    } else if (queryDto.sort === 'newest') {
      mappedRestaurants.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Search dishes with full active/approved hierarchy safety
    const dishWhere: Prisma.MenuItemWhereInput = {
      isAvailable: true,
      deletedAt: null,
      category: {
        isActive: true,
        branch: {
          isActive: true,
          deletedAt: null,
          restaurant: { status: RestaurantStatus.APPROVED, deletedAt: null },
        },
      },
    };

    if (query) {
      dishWhere.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (queryDto.cuisine && queryDto.cuisine !== 'All') {
      dishWhere.category = {
        isActive: true,
        branch: {
          isActive: true,
          deletedAt: null,
          restaurant: {
            status: RestaurantStatus.APPROVED,
            deletedAt: null,
            cuisineTags: { contains: queryDto.cuisine, mode: 'insensitive' },
          },
        },
      };
    }

    const dishes = await this.prisma.menuItem.findMany({
      where: dishWhere,
      include: {
        category: {
          include: {
            branch: {
              include: { restaurant: true },
            },
          },
        },
      },
      take: 20,
    });

    return {
      restaurants: mappedRestaurants.slice(0, 10),
      dishes: dishes.map((d) => ({
        id: d.id.toString(),
        name: d.name,
        description: d.description,
        imageUrl: d.imageUrl,
        basePrice: Number(d.basePrice),
        foodType: d.foodType,
        restaurantName: d.category.branch.restaurant.businessName,
        branchId: d.category.branch.id.toString(),
      })),
    };
  }

  async getSearchSuggestions(query: string) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const [restaurants, dishes] = await Promise.all([
      this.prisma.restaurant.findMany({
        where: {
          status: RestaurantStatus.APPROVED,
          deletedAt: null,
          businessName: { contains: cleanQuery, mode: 'insensitive' },
        },
        select: { id: true, businessName: true },
        take: 5,
      }),
      this.prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          deletedAt: null,
          name: { contains: cleanQuery, mode: 'insensitive' },
          category: {
            isActive: true,
            branch: {
              isActive: true,
              deletedAt: null,
              restaurant: { status: RestaurantStatus.APPROVED, deletedAt: null },
            },
          },
        },
        select: { id: true, name: true },
        take: 5,
      }),
    ]);

    const suggestions = [
      ...restaurants.map((r) => ({ type: 'restaurant', id: r.id.toString(), text: r.businessName })),
      ...dishes.map((d) => ({ type: 'dish', id: d.id.toString(), text: d.name })),
    ];

    return suggestions;
  }
}
