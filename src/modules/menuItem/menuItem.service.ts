import fs from 'fs';
import csv from 'csv-parser';
import {
  createMenuItemDto,
  importMenuItemsDto,
  updateAvailabilityDto,
  createAvailabilityScheduleDto,
  updateBestsellerDto,
  updateMenuItemDto,
} from './menuItem.dto.ts';

import {
  findBranchById,
  createMenuItem,
  findCategoryById,
  findMenuItemById,
  findMenuItemBySku,
  findModifierGroupsByIds,
  getMenuItemsByCategory,
  softDeleteMenuItem,
  updateMenuItem,
  updateMenuItemAvailability,
  updateMenuItemBestseller,

  findCategoryByBranch,
  bulkCreateMenuItems,
  createMenuItemImages,
  findMenuItemImageById,
  deleteMenuItemImage,

  getMenuItemAvailabilitySchedules,
  createMenuItemAvailabilitySchedule,
  deleteMenuItemAvailabilitySchedule,
} from './menuItem.repository.ts';

import { IMenuItemResponse } from './menuItem.interface.ts';

/**
 * ============================================================
 * GET ALL ITEMS OF CATEGORY
 * ============================================================
 */
async function getMenuItemsByCategoryService(
  categoryId: string
): Promise<IMenuItemResponse> {
  const category = await findCategoryById(
    BigInt(categoryId)
  );

  if (!category) {
    throw new Error('Category not found');
  }

  const items =
    await getMenuItemsByCategory(
      BigInt(categoryId)
    );

  return {
    message:
      'Menu items fetched successfully',
    data: items,
  };
}

/**
 * ============================================================
 * CREATE MENU ITEM
 * ============================================================
 */
async function createMenuItemService(
  categoryId: string,
  data: createMenuItemDto
): Promise<IMenuItemResponse> {
  /**
   * Validate category exists
   */
  const category = await findCategoryById(
    BigInt(categoryId)
  );

  if (!category) {
    throw new Error('Category not found');
  }

  /**
   * SKU must be unique
   */
  const existingSku =
    await findMenuItemBySku(data.sku);

  if (existingSku) {
    throw new Error(
      'Menu item SKU already exists'
    );
  }

  /**
   * Validate modifier groups
   */
  if (
    data.modifierGroupIds &&
    data.modifierGroupIds.length > 0
  ) {
    const modifierGroups =
      await findModifierGroupsByIds(
        data.modifierGroupIds.map(
          (id) => BigInt(id)
        )
      );

    if (
      modifierGroups.length !==
      data.modifierGroupIds.length
    ) {
      throw new Error(
        'One or more modifier groups do not exist'
      );
    }
  }

  const item = await createMenuItem({
    categoryId: BigInt(categoryId),

    sku: data.sku,

    name: data.name,

    description: data.description,

    basePrice: data.basePrice,
    foodType: data.foodType,
    dietaryTags: data.dietaryTags,
    modifierGroupIds:
      data.modifierGroupIds?.map(
        (id) => BigInt(id)
      ),
  });

  return {
    message:
      'Menu item created successfully',
    data: item,
  };
}

/**
 * ============================================================
 * GET SINGLE MENU ITEM
 * ============================================================
 */
async function getMenuItemByIdService(
  menuItemId: string
): Promise<IMenuItemResponse> {
  const item = await findMenuItemById(
    BigInt(menuItemId)
  );

  if (!item) {
    throw new Error(
      'Menu item not found'
    );
  }

  return {
    message:
      'Menu item fetched successfully',
    data: item,
  };
}

/**
 * ============================================================
 * UPDATE MENU ITEM
 * ============================================================
 */
async function updateMenuItemService(
  menuItemId: string,
  data: updateMenuItemDto
): Promise<IMenuItemResponse> {
  const existingItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!existingItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  const updatedItem =
    await updateMenuItem({
      id: BigInt(menuItemId),

      name: data.name,

      description: data.description,

      basePrice: data.basePrice,
      foodType: data.foodType,
      dietaryTags: data.dietaryTags,
    });

  return {
    message:
      'Menu item updated successfully',
    data: updatedItem,
  };
}

/**
 * ============================================================
 * TOGGLE AVAILABILITY
 * ============================================================
 */
async function updateMenuItemAvailabilityService(
  menuItemId: string,
  data: updateAvailabilityDto
): Promise<IMenuItemResponse> {
  const existingItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!existingItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  const item =
    await updateMenuItemAvailability({
      id: BigInt(menuItemId),

      isAvailable:
        data.isAvailable,
    });

  return {
    message:
      'Menu item availability updated successfully',
    data: item,
  };
}

/**
 * ============================================================
 * TOGGLE BESTSELLER
 * ============================================================
 */
async function updateMenuItemBestsellerService(
  menuItemId: string,
  data: updateBestsellerDto
): Promise<IMenuItemResponse> {
  const existingItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!existingItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  const item =
    await updateMenuItemBestseller({
      id: BigInt(menuItemId),

      isBestseller:
        data.isBestseller,
    });

  return {
    message:
      'Menu item bestseller status updated successfully',
    data: item,
  };
}

/**
 * ============================================================
 * SOFT DELETE MENU ITEM
 * ============================================================
 */

/**
 * ============================================================
 * MENU ITEM AVAILABILITY SCHEDULES
 * ============================================================
 */

async function getAvailabilitySchedulesService(menuItemId: string): Promise<IMenuItemResponse> {
  const existingItem = await findMenuItemById(BigInt(menuItemId));
  if (!existingItem) {
    throw new Error('Menu item not found');
  }

  const schedules = await getMenuItemAvailabilitySchedules(BigInt(menuItemId));

  return {
    message: 'Availability schedules fetched successfully',
    data: schedules,
  };
}

async function createAvailabilityScheduleService(
  menuItemId: string,
  data: createAvailabilityScheduleDto
): Promise<IMenuItemResponse> {
  const existingItem = await findMenuItemById(BigInt(menuItemId));
  if (!existingItem) {
    throw new Error('Menu item not found');
  }

  // Convert "HH:mm" to Date objects for Prisma
  const now = new Date();
  const startTimeObj = new Date(now.toDateString() + ' ' + data.startTime);
  const endTimeObj = new Date(now.toDateString() + ' ' + data.endTime);

  const schedule = await createMenuItemAvailabilitySchedule({
    menuItemId: BigInt(menuItemId),
    dayOfWeek: data.dayOfWeek,
    startTime: startTimeObj,
    endTime: endTimeObj,
  });

  return {
    message: 'Availability schedule created successfully',
    data: schedule,
  };
}

async function deleteAvailabilityScheduleService(
  menuItemId: string,
  scheduleId: string
): Promise<IMenuItemResponse> {
  const existingItem = await findMenuItemById(BigInt(menuItemId));
  if (!existingItem) {
    throw new Error('Menu item not found');
  }

  // Optionally verify schedule belongs to menu item, but deletion by ID is usually sufficient if we trust the route or we can do a check
  await deleteMenuItemAvailabilitySchedule(BigInt(scheduleId));

  return {
    message: 'Availability schedule deleted successfully',
  };
}

/**
 * ============================================================
 * SOFT DELETE MENU ITEM
 * ============================================================
 */
async function deleteMenuItemService(
  menuItemId: string
): Promise<IMenuItemResponse> {
  const existingItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!existingItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  await softDeleteMenuItem(
    BigInt(menuItemId)
  );

  return {
    message:
      'Menu item deleted successfully',
  };
}


/**
 * ============================================================
 * UPLOAD MENU ITEM IMAGE
 * ============================================================
 */
async function uploadMenuItemImageService(
  menuItemId: string,
  file: Express.Multer.File
): Promise<IMenuItemResponse> {
  /**
   * Validate menu item exists
   */
  const menuItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!menuItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  /**
   * Create image record
   */
  await createMenuItemImages({
    menuItemId: BigInt(menuItemId),

    imageUrls: ['/' + file.path.replace(/\\/g, '/')],
  });

  /**
   * Return latest item
   */
  const updatedItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  return {
    message:
      'Menu item image uploaded successfully',
    data: updatedItem,
  };
}

/**
 * ============================================================
 * DELETE MENU ITEM IMAGE
 * ============================================================
 */
async function deleteMenuItemImageService(
  menuItemId: string,
  imageId: string
): Promise<IMenuItemResponse> {
  /**
   * Validate menu item exists
   */
  const menuItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!menuItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  /**
   * Validate image exists
   */
  const image =
    await findMenuItemImageById(
      BigInt(imageId)
    );

  if (!image) {
    throw new Error(
      'Menu item image not found'
    );
  }

  /**
   * Ensure image belongs to menu item
   */
  if (
    image.menuItemId !==
    BigInt(menuItemId)
  ) {
    throw new Error(
      'Image does not belong to this menu item'
    );
  }

  /**
   * Delete physical file
   */
  if (
    image.imageUrl &&
    fs.existsSync(
      image.imageUrl
    )
  ) {
    fs.unlinkSync(
      image.imageUrl
    );
  }

  /**
   * Delete DB record
   */
  await deleteMenuItemImage(
    BigInt(imageId)
  );

  return {
    message:
      'Menu item image deleted successfully',
  };
}

/**
 * ============================================================
 * IMPORT MENU ITEMS FROM CSV
 * ============================================================
 */
async function importMenuItemsService(
  branchId: string,
  file: Express.Multer.File
): Promise<IMenuItemResponse> {
  /**
   * Validate branch
   */
  const branch =
    await findBranchById(
      BigInt(branchId)
    );

  if (!branch) {
    throw new Error(
      'Branch not found'
    );
  }

  /**
   * Parse CSV
   */
  const rows: importMenuItemsDto[] =
    [];

  await new Promise<void>(
    (
      resolve,
      reject
    ) => {
      fs.createReadStream(
        file.path
      )
        .pipe(csv())
        .on(
          'data',
          (
            row: importMenuItemsDto
          ) => {
            rows.push(row);
          }
        )
        .on(
          'end',
          () => resolve()
        )
        .on(
          'error',
          reject
        );
    }
  );

  /**
   * Empty CSV
   */
  if (rows.length === 0) {
    throw new Error(
      'CSV file is empty'
    );
  }

  const validItems: {
    categoryId: bigint;
    sku: string;
    name: string;
    description?: string;
    basePrice: number;
    foodType: any;
  }[] = [];

  let skipped = 0;

  /**
   * Validate rows
   */
  for (const row of rows) {
    const category =
      await findCategoryByBranch(
        BigInt(
          row.categoryId
        ),
        BigInt(branchId)
      );

    if (!category) {
      skipped++;
      continue;
    }

    validItems.push({
      categoryId: BigInt(
        row.categoryId
      ),

      sku: row.sku,

      name: row.name,

      description:
        row.description,

      basePrice:
        Number(
          row.basePrice
        ),

      foodType:
        row.foodType,
    });
  }

  /**
   * Bulk insert
   */
  const result =
    await bulkCreateMenuItems(
      validItems
    );

  /**
   * Delete uploaded CSV
   */
  if (
    fs.existsSync(
      file.path
    )
  ) {
    fs.unlinkSync(
      file.path
    );
  }

  return {
    message:
      'Menu items imported successfully',

    data: {
      totalRows:
        rows.length,

      inserted:
        result.count,

      skipped,
    },
  };
}




async function duplicateMenuItemService(
  menuItemId: string
): Promise<IMenuItemResponse> {
  const existingItem = await findMenuItemById(BigInt(menuItemId));

  if (!existingItem) {
    throw new Error('Menu item not found');
  }

  let copySku = `${existingItem.sku}-copy`;
  let counter = 1;
  while (await findMenuItemBySku(copySku)) {
    copySku = `${existingItem.sku}-copy-${counter}`;
    counter++;
  }

  const duplicated = await createMenuItem({
    categoryId: existingItem.categoryId,
    sku: copySku,
    name: `${existingItem.name} - Copy`,
    description: existingItem.description || undefined,
    basePrice: Number(existingItem.basePrice),
    foodType: existingItem.foodType,
    dietaryTags: existingItem.dietaryTags as string[] | undefined,
    modifierGroupIds: existingItem.modifierGroups.map(mg => mg.modifierGroupId)
  });

  return {
    message: 'Menu item duplicated successfully',
    data: duplicated,
  };
}

export {
  getMenuItemsByCategoryService,
  createMenuItemService,
  getMenuItemByIdService,
  updateMenuItemService,
  updateMenuItemAvailabilityService,
  updateMenuItemBestsellerService,
  deleteMenuItemService,
  duplicateMenuItemService,

  getAvailabilitySchedulesService,
  createAvailabilityScheduleService,
  deleteAvailabilityScheduleService,

  uploadMenuItemImageService,
  deleteMenuItemImageService,
  importMenuItemsService,
};