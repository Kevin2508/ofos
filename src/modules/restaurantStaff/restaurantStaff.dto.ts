interface createRestaurantStaffDto {
  userId: string;
  designation: 'MANAGER' | 'KITCHEN_STAFF' | 'CASHIER' | 'SUPERVISOR';
}

interface updateRestaurantStaffDto {
  designation?: 'MANAGER' | 'KITCHEN_STAFF' | 'CASHIER' | 'SUPERVISOR';
  status?: 'ACTIVE' | 'INACTIVE';
}

interface restaurantStaffParamsDto {
  branchId: string;
}

interface restaurantStaffIdParamsDto {
  branchId: string;
  id: string;
}

export {
  createRestaurantStaffDto,
  updateRestaurantStaffDto,
  restaurantStaffParamsDto,
  restaurantStaffIdParamsDto,
};