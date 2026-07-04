import { FoodType } from '../../generated/prisma/enums.ts';


interface categoryIdParamsDto {
  categoryId: string;
}

interface menuItemIdParamsDto {
  id: string;
}

interface menuItemImageParamsDto {
  id: string;
  imageId: string;
}

interface branchIdParamsDto {
  branchId: string;
}

interface scheduleParamsDto {
  id: string; 
  scheduleId: string;
}


interface createMenuItemDto {
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  foodType: FoodType;
  dietaryTags?: string[];
  modifierGroupIds?: string[];
}


interface updateMenuItemDto {
  name?: string;
  description?: string;
  basePrice?: number;
  foodType?: FoodType;
  dietaryTags?: string[];
}


interface updateAvailabilityDto {
  isAvailable: boolean;
}

interface createAvailabilityScheduleDto {
  dayOfWeek: number;
  startTime: string; 
  endTime: string;
}


interface updateBestsellerDto {
  isBestseller: boolean;
}



interface importMenuItemsDto {
  categoryId: string;
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  foodType: FoodType;
}


interface importMenuItemsResultDto {
  totalRows: number;
  inserted: number;
  skipped: number;
}


export {
  categoryIdParamsDto,
  menuItemIdParamsDto,
  menuItemImageParamsDto,
  branchIdParamsDto,
  scheduleParamsDto,

  createMenuItemDto,
  updateMenuItemDto,

  updateAvailabilityDto,
  createAvailabilityScheduleDto,
  updateBestsellerDto,

  importMenuItemsDto,
  importMenuItemsResultDto,
};