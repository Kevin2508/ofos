import { FoodType } from '../../generated/prisma/enums.ts';

/**
 * Route Params
 */

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
  id: string; // menuItemId
  scheduleId: string;
}

/**
 * Create Menu Item
 */

interface createMenuItemDto {
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  foodType: FoodType;

  /**
   * Optional Modifier Groups
   */
  modifierGroupIds?: string[];
}

/**
 * Update Menu Item
 */

interface updateMenuItemDto {
  name?: string;
  description?: string;
  basePrice?: number;
  foodType?: FoodType;
}

/**
 * Availability Toggle
 */

interface updateAvailabilityDto {
  isAvailable: boolean;
}

/**
 * Availability Schedule
 */

interface createAvailabilityScheduleDto {
  dayOfWeek: number;
  startTime: string; // ISO or HH:mm:ss
  endTime: string;
}

/**
 * Bestseller Toggle
 */

interface updateBestsellerDto {
  isBestseller: boolean;
}

/**
 * CSV Import DTO
 */

interface importMenuItemsDto {
  categoryId: string;
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  foodType: FoodType;
}

/**
 * CSV Import Result
 *
 * Returned after bulk import completes.
 */
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