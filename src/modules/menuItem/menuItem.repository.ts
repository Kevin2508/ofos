import { prisma } from '../../config/prisma.ts';

import {
  FoodType,
} from '../../generated/prisma/enums.ts';

/**
 * ============================================================
 * CATEGORY
 * ============================================================
 */

/**
 * Verify category exists and is active.
 */
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

/**
 * Verify category belongs to branch.
 */
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

/**
 * ============================================================
 * MODIFIER GROUPS
 * ============================================================
 */

/**
 * Fetch modifier groups with options.
 */
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

/**
 * ============================================================
 * MENU ITEMS
 * ============================================================
 */

/**
 * Find menu item by id.
 */
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

/**
 * Find menu item using SKU.
 */
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

/**
 * Fetch all items under category.
 */
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

/**
 * Create menu item.
 */
async function createMenuItem({
  categoryId,
  sku,
  name,
  description,
  basePrice,
  foodType,
  modifierGroupIds,
}: {
  categoryId: bigint;
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  foodType: FoodType;
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

/**
 * Update menu item.
 */
async function updateMenuItem({
  id,
  name,
  description,
  basePrice,
  foodType,
}: {
  id: bigint;
  name?: string;
  description?: string;
  basePrice?: number;
  foodType?: FoodType;
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
    },
  });
}

/**
 * Toggle availability.
 */
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

/**
 * Toggle bestseller.
 */
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

/**
 * ============================================================
 * AVAILABILITY SCHEDULES
 * ============================================================
 */

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

/**
 * Soft delete menu item.
 */
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

/**
 * ============================================================
 * IMAGES
 * ============================================================
 */

/**
 * Add gallery images.
 */
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

/**
 * Find image by id.
 */
async function findMenuItemImageById(
  imageId: bigint
) {
  return prisma.menuItemImage.findUnique({
    where: {
      id: imageId,
    },
  });
}

/**
 * Delete image.
 */
async function deleteMenuItemImage(
  imageId: bigint
) {
  return prisma.menuItemImage.delete({
    where: {
      id: imageId,
    },
  });
}

/**
 * ============================================================
 * BRANCH
 * ============================================================
 */

/**
 * Verify branch exists.
 */
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



/**
 * ============================================================
 * CSV IMPORT
 * ============================================================
 */

/**
 * Bulk insert items.
 */
async function bulkCreateMenuItems(
  items: {
    categoryId: bigint;
    sku: string;
    name: string;
    description?: string;
    basePrice: number;
    foodType: FoodType;
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