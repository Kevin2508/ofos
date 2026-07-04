import { prisma } from '../../config/prisma.ts';

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

async function findCategoryByName({
  branchId,
  name,
}: {
  branchId: bigint;
  name: string;
}) {
  return prisma.menuCategory.findFirst({
    where: {
      branchId,
      name,
    },
  });
}

async function createMenuCategory({
  branchId,
  name,
  description,
  displayOrder,
}: {
  branchId: bigint;
  name: string;
  description?: string;
  displayOrder: number;
}) {
  return prisma.menuCategory.create({
    data: {
      branchId,
      name,
      description,
      displayOrder,
    },
  });
}

async function getMenuCategoryList({
  branchId,
}: {
  branchId: bigint;
}) {
  return prisma.menuCategory.findMany({
    where: {
      branchId,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });
}

async function getMenuCategoryById(
  id: bigint
) {
  return prisma.menuCategory.findFirst({
    where: {
      id,
    },
    include: {
      menuItems: {
        select: {
          id: true,
        },
      },
    },
  });
}

async function updateMenuCategory({
  id,
  name,
  description,
  displayOrder,
}: {
  id: bigint;
  name?: string;
  description?: string;
  displayOrder?: number;
}) {
  return prisma.menuCategory.update({
    where: {
      id,
    },
    data: {
      ...(name !== undefined && {
        name,
      }),

      ...(description !== undefined && {
        description,
      }),

      ...(displayOrder !== undefined && {
        displayOrder,
      }),
    },
  });
}

async function updateMenuCategoryAvailability({
  id,
  isActive,
}: {
  id: bigint;
  isActive: boolean;
}) {
  return prisma.menuCategory.update({
    where: {
      id,
    },
    data: {
      isActive,
    },
  });
}

async function deleteMenuCategory(
  id: bigint
) {
  return prisma.menuCategory.delete({
    where: {
      id,
    },
  });
}

async function reorderMenuCategories(
  categories: {
    id: bigint;
    displayOrder: number;
  }[]
) {
  return prisma.$transaction(
    categories.map((category) =>
      prisma.menuCategory.update({
        where: {
          id: category.id,
        },
        data: {
          displayOrder:
            category.displayOrder,
        },
      })
    )
  );
}

export {
  findBranchById,
  findCategoryByName,
  createMenuCategory,
  getMenuCategoryList,
  getMenuCategoryById,
  updateMenuCategory,
  updateMenuCategoryAvailability,
  deleteMenuCategory,
  reorderMenuCategories,
};