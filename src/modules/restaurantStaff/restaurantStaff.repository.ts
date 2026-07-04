import { prisma } from '../../config/prisma.ts';
import {
  StaffDesignation,
  StaffStatus,
} from '../../generated/prisma/enums.ts';

async function findBranchById(branchId: bigint) {
  return prisma.restaurantBranch.findFirst({
    where: {
      id: branchId,
      deletedAt: null,
    },
  });
}

async function findUserById(userId: bigint) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
  });
}

async function findStaffByBranchAndUser(
  branchId: bigint,
  userId: bigint
) {
  return prisma.restaurantStaff.findUnique({
    where: {
      branchId_userId: {
        branchId,
        userId,
      },
    },
  });
}

async function createRestaurantStaff({
  branchId,
  userId,
  designation,
}: {
  branchId: bigint;
  userId: bigint;
  designation: StaffDesignation;
}) {
  return prisma.restaurantStaff.create({
    data: {
      branchId,
      userId,
      designation,
    },
    include: {
      user: true,
      branch: true,
    },
  });
}

async function getRestaurantStaffList({
  branchId,
}: {
  branchId: bigint;
}) {
  return prisma.restaurantStaff.findMany({
    where: {
      branchId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });
}

async function getRestaurantStaffById(id: bigint) {
  return prisma.restaurantStaff.findFirst({
    where: {
      id,
    },
    include: {
      user: true,
      branch: true,
    },
  });
}

async function updateRestaurantStaff({
  id,
  designation,
  status,
}: {
  id: bigint;
  designation?: StaffDesignation;
  status?: StaffStatus;
}) {
  return prisma.restaurantStaff.update({
    where: {
      id,
    },
    data: {
      ...(designation && { designation }),
      ...(status && { status }),
    },
    include: {
      user: true,
      branch: true,
    },
  });
}

async function deleteRestaurantStaff(id: bigint) {
  return prisma.restaurantStaff.delete({
    where: {
      id,
    },
  });
}

export {
  findBranchById,
  findUserById,
  findStaffByBranchAndUser,
  createRestaurantStaff,
  getRestaurantStaffList,
  getRestaurantStaffById,
  updateRestaurantStaff,
  deleteRestaurantStaff,
};