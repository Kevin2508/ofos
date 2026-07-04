import { prisma } from '../../config/prisma.ts';

import {
  FoodType,
} from '../../generated/prisma/enums.ts';

async function findCategoryById(
  categoryId: bigint
) {
  return prisma.menuCategory.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
  });
}


async function findCategoryByBranch(
  categoryId: bigint,
  branchId: bigint
) {
  return prisma.menuCategory.findFirst({
    where: {
      id: categoryId,
      branchId,
      isActive: true,
    },
  });
}

async function findModifierGroupsByIds(
  ids: bigint[]
) {
  return prisma.modifierGroup.findMany({
    where: {
      id: {
        in: ids,
      },
    },

    include: {
      options: true,
    },
  });
}

async function findMenuItemById(id: bigint) {
  return prisma.menuItem.findFirst({
    where: {
      id,
      deletedAt: null,
    },

    include: {
      category: true,

      images: {
        orderBy: {
          displayOrder: 'asc',
        },
      },

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
  });
}

async function findMenuItemBySku(
  sku: string
) {
  return prisma.menuItem.findFirst({
    where: {
      sku,
      deletedAt: null,
    },
  });
}

async function getMenuItemsByCategory(
  categoryId: bigint
) {
  return prisma.menuItem.findMany({
    where: {
      categoryId,
      deletedAt: null,
    },

    include: {
      images: true,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function createMenuItem({
  categoryId,
  sku,
  name,
  description,
  basePrice,
  foodType, dietaryTags,
  modifierGroupIds,
}: {
  categoryId: bigint;
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  foodType: FoodType;
  dietaryTags?: string[];
  modifierGroupIds?: bigint[];
}) {
  return prisma.$transaction(
    async (tx) => {
      const item =
        await tx.menuItem.create({
          data: {
            categoryId,
            sku,
            name,
            description,
            basePrice,
            foodType,
            dietaryTags: dietaryTags || undefined,
          },
        });

      if (
        modifierGroupIds &&
        modifierGroupIds.length > 0
      ) {
        await tx.menuItemModifierGroup.createMany(
          {
            data: modifierGroupIds.map(
              (
                modifierGroupId
              ) => ({
                menuItemId: item.id,
                modifierGroupId,
              })
            ),
          }
        );
      }

      return item;
    }
  );
}

async function updateMenuItem({
  id,
  name,
  description,
  basePrice,
  foodType,
  dietaryTags,
}: {
  id: bigint;
  name?: string;
  description?: string;
  basePrice?: number;
  foodType?: FoodType;
  dietaryTags?: string[];
}) {
  return prisma.menuItem.update({
    where: {
      id,
    },

    data: {
      ...(name && { name }),
      ...(description !== undefined && {
        description,
      }),
      ...(basePrice && {
        basePrice,
      }),
      ...(foodType && {
        foodType,
      }),
      ...(dietaryTags !== undefined && {
        dietaryTags: dietaryTags || null,
      }),
    },
  });
}

async function updateMenuItemAvailability({
  id,
  isAvailable,
}: {
  id: bigint;
  isAvailable: boolean;
}) {
  return prisma.menuItem.update({
    where: {
      id,
    },

    data: {
      isAvailable,
    },
  });
}

async function updateMenuItemBestseller({
  id,
  isBestseller,
}: {
  id: bigint;
  isBestseller: boolean;
}) {
  return prisma.menuItem.update({
    where: {
      id,
    },

    data: {
      isBestseller,
    },
  });
}

async function getMenuItemAvailabilitySchedules(menuItemId: bigint) {
  return prisma.menuItemAvailability.findMany({
    where: {
      menuItemId,
    },
    orderBy: {
      dayOfWeek: 'asc',
    },
  });
}

async function createMenuItemAvailabilitySchedule({
  menuItemId,
  dayOfWeek,
  startTime,
  endTime,
}: {
  menuItemId: bigint;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
}) {
  return prisma.menuItemAvailability.create({
    data: {
      menuItemId,
      dayOfWeek,
      startTime,
      endTime,
    },
  });
}

async function deleteMenuItemAvailabilitySchedule(scheduleId: bigint) {
  return prisma.menuItemAvailability.delete({
    where: {
      id: scheduleId,
    },
  });
}

async function softDeleteMenuItem(
  id: bigint
) {
  return prisma.menuItem.update({
    where: {
      id,
    },

    data: {
      deletedAt: new Date(),
    },
  });
}

async function createMenuItemImages({
  menuItemId,
  imageUrls,
}: {
  menuItemId: bigint;
  imageUrls: string[];
}) {
  return prisma.menuItemImage.createMany({
    data: imageUrls.map(
      (imageUrl, index) => ({
        menuItemId,
        imageUrl,
        displayOrder: index,
      })
    ),
  });
}

async function findMenuItemImageById(
  imageId: bigint
) {
  return prisma.menuItemImage.findUnique({
    where: {
      id: imageId,
    },
  });
}

async function deleteMenuItemImage(
  imageId: bigint
) {
  return prisma.menuItemImage.delete({
    where: {
      id: imageId,
    },
  });
}

async function findBranchById(
  branchId: bigint
) {
  return prisma.restaurantBranch.findFirst({
    where: {
      id: branchId,
      deletedAt: null,
    },
  });
}

async function bulkCreateMenuItems(
  items: {
    categoryId: bigint;
    sku: string;
    name: string;
    description?: string;
    basePrice: number;
    foodType: FoodType;
    dietaryTags?: string[];
  }[]
) {
  return prisma.menuItem.createMany({
    data: items,
    skipDuplicates: true,
  });
}

export {
  findBranchById,
  findCategoryById,
  findCategoryByBranch,

  findModifierGroupsByIds,

  findMenuItemById,
  findMenuItemBySku,
  getMenuItemsByCategory,

  createMenuItem,
  updateMenuItem,
  updateMenuItemAvailability,
  updateMenuItemBestseller,
  softDeleteMenuItem,

  getMenuItemAvailabilitySchedules,
  createMenuItemAvailabilitySchedule,
  deleteMenuItemAvailabilitySchedule,

  createMenuItemImages,
  findMenuItemImageById,
  deleteMenuItemImage,

  bulkCreateMenuItems,
};