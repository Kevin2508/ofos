interface MenuCategoryParamsDto {
  branchId: string;
}

interface MenuCategoryIdParamsDto
  extends MenuCategoryParamsDto {
  id: string;
}

interface CreateMenuCategoryDto {
  name: string;
  description?: string;
  displayOrder?: number;
}

interface UpdateMenuCategoryDto {
  name?: string;
  description?: string;
  displayOrder?: number;
}

interface ReorderMenuCategoryDto {
  categories: {
    id: string;
    displayOrder: number;
  }[];
}

export {
  MenuCategoryParamsDto,
  MenuCategoryIdParamsDto,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  ReorderMenuCategoryDto,
};