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

async function createMenuItemService(
  categoryId: string,
  data: createMenuItemDto
): Promise<IMenuItemResponse> {
 
  const category = await findCategoryById(
    BigInt(categoryId)
  );

  if (!category) {
    throw new Error('Category not found');
  }

  const existingSku =
    await findMenuItemBySku(data.sku);

  if (existingSku) {
    throw new Error(
      'Menu item SKU already exists'
    );
  }

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

  await deleteMenuItemAvailabilitySchedule(BigInt(scheduleId));

  return {
    message: 'Availability schedule deleted successfully',
  };
}

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

async function uploadMenuItemImageService(
  menuItemId: string,
  file: Express.Multer.File
): Promise<IMenuItemResponse> {

  const menuItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!menuItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  await createMenuItemImages({
    menuItemId: BigInt(menuItemId),

    imageUrls: ['/' + file.path.replace(/\\/g, '/')],
  });

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

async function deleteMenuItemImageService(
  menuItemId: string,
  imageId: string
): Promise<IMenuItemResponse> {
  const menuItem =
    await findMenuItemById(
      BigInt(menuItemId)
    );

  if (!menuItem) {
    throw new Error(
      'Menu item not found'
    );
  }

  const image =
    await findMenuItemImageById(
      BigInt(imageId)
    );

  if (!image) {
    throw new Error(
      'Menu item image not found'
    );
  }
  if (
    image.menuItemId !==
    BigInt(menuItemId)
  ) {
    throw new Error(
      'Image does not belong to this menu item'
    );
  }
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
  await deleteMenuItemImage(
    BigInt(imageId)
  );

  return {
    message:
      'Menu item image deleted successfully',
  };
}

async function importMenuItemsService(
  branchId: string,
  file: Express.Multer.File
): Promise<IMenuItemResponse> {
  const branch =
    await findBranchById(
      BigInt(branchId)
    );

  if (!branch) {
    throw new Error(
      'Branch not found'
    );
  }
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
  const result =
    await bulkCreateMenuItems(
      validItems
    );
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