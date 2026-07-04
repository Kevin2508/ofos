import {
  CreateMenuCategoryDto,
  ReorderMenuCategoryDto,
  UpdateMenuCategoryDto,
  UpdateMenuCategoryAvailabilityDto,
} from './menuCategory.dto.ts';

import {
  createMenuCategory,
  deleteMenuCategory,
  findBranchById,
  findCategoryByName,
  getMenuCategoryById,
  getMenuCategoryList,
  reorderMenuCategories,
  updateMenuCategory,
  updateMenuCategoryAvailability,
} from './menuCategory.repository.ts';

import { IMenuCategoryResponse } from './menuCategory.interface.ts';

async function getMenuCategoryListService(
  branchId: string
): Promise<IMenuCategoryResponse> {
  const branch = await findBranchById(
    BigInt(branchId)
  );

  if (!branch) {
    throw new Error('Branch not found');
  }

  const categories =
    await getMenuCategoryList({
      branchId: BigInt(branchId),
    });

  return {
    message:
      'Menu categories fetched successfully',
    data: categories,
  };
}

async function createMenuCategoryService(
  branchId: string,
  data: CreateMenuCategoryDto
): Promise<IMenuCategoryResponse> {
  const branch = await findBranchById(
    BigInt(branchId)
  );

  if (!branch) {
    throw new Error('Branch not found');
  }

  const existingCategory =
    await findCategoryByName({
      branchId: BigInt(branchId),
      name: data.name,
    });

  if (existingCategory) {
    throw new Error(
      'Category with same name already exists'
    );
  }

  const category =
    await createMenuCategory({
      branchId: BigInt(branchId),
      name: data.name,
      description: data.description,
      displayOrder:
        data.displayOrder ?? 0,
    });

  return {
    message:
      'Menu category created successfully',
    data: category,
  };
}

async function updateMenuCategoryService(
  branchId: string,
  categoryId: string,
  data: UpdateMenuCategoryDto
): Promise<IMenuCategoryResponse> {
  const branch = await findBranchById(
    BigInt(branchId)
  );

  if (!branch) {
    throw new Error('Branch not found');
  }

  const category =
    await getMenuCategoryById(
      BigInt(categoryId)
    );

  if (!category) {
    throw new Error('Category not found');
  }

  if (
    category.branchId !== BigInt(branchId)
  ) {
    throw new Error(
      'Category does not belong to this branch'
    );
  }

  if (
    data.name &&
    data.name !== category.name
  ) {
    const duplicate =
      await findCategoryByName({
        branchId: BigInt(branchId),
        name: data.name,
      });

    if (
      duplicate &&
      duplicate.id !== category.id
    ) {
      throw new Error(
        'Category name already exists'
      );
    }
  }

  const updatedCategory =
    await updateMenuCategory({
      id: BigInt(categoryId),
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder,
    });

  return {
    message:
      'Menu category updated successfully',
    data: updatedCategory,
  };
}

async function updateMenuCategoryAvailabilityService(
  branchId: string,
  categoryId: string,
  data: UpdateMenuCategoryAvailabilityDto
): Promise<IMenuCategoryResponse> {
  const branch = await findBranchById(BigInt(branchId));
  if (!branch) throw new Error('Branch not found');

  const category = await getMenuCategoryById(BigInt(categoryId));
  if (!category || category.branchId !== BigInt(branchId)) {
    throw new Error('Category not found');
  }

  const updated = await updateMenuCategoryAvailability({
    id: BigInt(categoryId),
    isActive: data.isActive,
  });

  return {
    message: 'Menu category availability updated successfully',
    data: updated,
  };
}

async function deleteMenuCategoryService(
  branchId: string,
  categoryId: string
): Promise<IMenuCategoryResponse> {
  const branch = await findBranchById(
    BigInt(branchId)
  );

  if (!branch) {
    throw new Error('Branch not found');
  }

  const category =
    await getMenuCategoryById(
      BigInt(categoryId)
    );

  if (!category) {
    throw new Error('Category not found');
  }

  if (
    category.branchId !== BigInt(branchId)
  ) {
    throw new Error(
      'Category does not belong to this branch'
    );
  }

  /**
   * Business Rule:
   * Category must be empty
   */
  if (
    category.menuItems.length > 0
  ) {
    throw new Error(
      'Cannot delete category containing menu items'
    );
  }

  await deleteMenuCategory(
    BigInt(categoryId)
  );

  return {
    message:
      'Menu category deleted successfully',
  };
}

async function reorderMenuCategoryService(
  branchId: string,
  data: ReorderMenuCategoryDto
): Promise<IMenuCategoryResponse> {
  const branch = await findBranchById(
    BigInt(branchId)
  );

  if (!branch) {
    throw new Error('Branch not found');
  }

  /**
   * Validate all categories
   */
  for (const category of data.categories) {
    const dbCategory =
      await getMenuCategoryById(
        BigInt(category.id)
      );

    if (!dbCategory) {
      throw new Error(
        `Category ${category.id} not found`
      );
    }

    if (
      dbCategory.branchId !==
      BigInt(branchId)
    ) {
      throw new Error(
        `Category ${category.id} does not belong to branch`
      );
    }
  }

  await reorderMenuCategories(
    data.categories.map(
      (category) => ({
        id: BigInt(category.id),
        displayOrder:
          category.displayOrder,
      })
    )
  );

  return {
    message:
      'Menu categories reordered successfully',
  };
}

async function duplicateMenuCategoryService(
  branchId: string,
  categoryId: string
): Promise<IMenuCategoryResponse> {
  const branch = await findBranchById(BigInt(branchId));
  if (!branch) {
    throw new Error('Branch not found');
  }

  const category = await getMenuCategoryById(BigInt(categoryId));
  if (!category || category.branchId !== BigInt(branchId)) {
    throw new Error('Category not found');
  }

  let copyName = `${category.name} - Copy`;
  let existing = await findCategoryByName({ branchId: BigInt(branchId), name: copyName });
  let counter = 1;
  while (existing) {
    copyName = `${category.name} - Copy ${counter}`;
    existing = await findCategoryByName({ branchId: BigInt(branchId), name: copyName });
    counter++;
  }

  const duplicated = await createMenuCategory({
    branchId: BigInt(branchId),
    name: copyName,
    description: category.description || undefined,
    displayOrder: category.displayOrder + 1,
  });

  return {
    message: 'Menu category duplicated successfully',
    data: duplicated,
  };
}

export {
  getMenuCategoryListService,
  createMenuCategoryService,
  updateMenuCategoryService,
  updateMenuCategoryAvailabilityService,
  deleteMenuCategoryService,
  reorderMenuCategoryService,
  duplicateMenuCategoryService,
};