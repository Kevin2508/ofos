import {
  createRestaurantStaffDto,
  updateRestaurantStaffDto,
} from './restaurantStaff.dto.ts';

import {
  createRestaurantStaff,
  deleteRestaurantStaff,
  findBranchById,
  findStaffByBranchAndUser,
  findUserById,
  getRestaurantStaffById,
  getRestaurantStaffList,
  updateRestaurantStaff,
} from './restaurantStaff.repository.ts';

import { IRestaurantStaffResponse } from './restaurantStaff.interface.ts';

async function getRestaurantStaffListService(
  branchId: string
): Promise<IRestaurantStaffResponse> {
  const branch = await findBranchById(BigInt(branchId));

  if (!branch) {
    throw new Error('Branch not found');
  }

  const staff = await getRestaurantStaffList({
    branchId: BigInt(branchId),
  });

  return {
    message: 'Staff fetched successfully',
    data: staff,
  };
}

async function createRestaurantStaffService(
  branchId: string,
  data: createRestaurantStaffDto
): Promise<IRestaurantStaffResponse> {
  const branch = await findBranchById(BigInt(branchId));

  if (!branch) {
    throw new Error('Branch not found');
  }

  const user = await findUserById(BigInt(data.userId));

  if (!user) {
    throw new Error('User not found');
  }

  const existingStaff = await findStaffByBranchAndUser(
    BigInt(branchId),
    BigInt(data.userId)
  );

  if (existingStaff) {
    throw new Error(
      'User is already assigned to this branch'
    );
  }

  const staff = await createRestaurantStaff({
    branchId: BigInt(branchId),
    userId: BigInt(data.userId),
    designation: data.designation,
  });

  return {
    message: 'Staff member added successfully',
    data: staff,
  };
}

async function updateRestaurantStaffService(
  branchId: string,
  staffId: string,
  data: updateRestaurantStaffDto
): Promise<IRestaurantStaffResponse> {
  const branch = await findBranchById(BigInt(branchId));

  if (!branch) {
    throw new Error('Branch not found');
  }

  const staff = await getRestaurantStaffById(
    BigInt(staffId)
  );

  if (!staff) {
    throw new Error('Staff member not found');
  }

  if (staff.branchId !== BigInt(branchId)) {
    throw new Error(
      'Staff member does not belong to this branch'
    );
  }

  const updatedStaff = await updateRestaurantStaff({
    id: BigInt(staffId),
    designation: data.designation,
    status: data.status,
  });

  return {
    message: 'Staff member updated successfully',
    data: updatedStaff,
  };
}

async function deleteRestaurantStaffService(
  branchId: string,
  staffId: string
): Promise<IRestaurantStaffResponse> {
  const branch = await findBranchById(BigInt(branchId));

  if (!branch) {
    throw new Error('Branch not found');
  }

  const staff = await getRestaurantStaffById(
    BigInt(staffId)
  );

  if (!staff) {
    throw new Error('Staff member not found');
  }

  if (staff.branchId !== BigInt(branchId)) {
    throw new Error(
      'Staff member does not belong to this branch'
    );
  }

  await deleteRestaurantStaff(BigInt(staffId));

  return {
    message: 'Staff member removed successfully',
  };
}

export {
  getRestaurantStaffListService,
  createRestaurantStaffService,
  updateRestaurantStaffService,
  deleteRestaurantStaffService,
};