import { prisma } from "../../config/prisma.ts";

async function createBranch(data: {
  restaurantId: bigint;
  branchName: string;
  gstin: string;
  fssaiLicenseNumber: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  minimumOrderValue?: number;
  deliveryFee?: number;
}) {
  return prisma.restaurantBranch.create({ data });
}

async function findBranchesByRestaurant(restaurantId: bigint) {
  return prisma.restaurantBranch.findMany({
    where: { restaurantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

async function findBranchById(id: bigint) {
  return prisma.restaurantBranch.findFirst({
    where: { id, deletedAt: null },
  });
}

async function findBranchByIdAndRestaurant(id: bigint, restaurantId: bigint) {
  return prisma.restaurantBranch.findFirst({
    where: { id, restaurantId, deletedAt: null },
  });
}

async function updateBranch(
  id: bigint,
  data: {
    branchName?: string;
    contactPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    minimumOrderValue?: number;
    deliveryFee?: number;
    isAcceptingOrders?: boolean;
    autoResumeAt?: Date | null;
  }
) {
  return prisma.restaurantBranch.update({ where: { id }, data });
}

async function deactivateBranch(id: bigint) {
  return prisma.restaurantBranch.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });
}

async function getOperatingHours(branchId: bigint) {
  return prisma.restaurantOperatingHour.findMany({
    where: {
      branchId,
    },
    orderBy: {
      dayOfWeek: "asc",
    },
  });
}


async function replaceOperatingHours(
  branchId: bigint,
  hours: any[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.restaurantOperatingHour.deleteMany({
      where: {
        branchId,
      },
    });

    return tx.restaurantOperatingHour.createMany({
      data: hours.map((hour) => ({
        branchId,
        dayOfWeek: hour.dayOfWeek,
        openingTime: hour.openingTime
          ? new Date(`1970-01-01T${hour.openingTime}`)
          : null,
        closingTime: hour.closingTime
          ? new Date(`1970-01-01T${hour.closingTime}`)
          : null,
        isClosed: hour.isClosed,
      })),
    });
  });
}

async function updateOperatingHour(
  branchId: bigint,
  dayOfWeek: number,
  data: {
    openingTime?: string;
    closingTime?: string;
    isClosed?: boolean;
  }
) {
  return prisma.restaurantOperatingHour.update({
    where: {
      branchId_dayOfWeek: {
        branchId,
        dayOfWeek,
      },
    },

    data: {
      ...(data.openingTime && {
        openingTime: new Date(
          `1970-01-01T${data.openingTime}`
        ),
      }),

      ...(data.closingTime && {
        closingTime: new Date(
          `1970-01-01T${data.closingTime}`
        ),
      }),

      ...(data.isClosed !== undefined && {
        isClosed: data.isClosed,
      }),
    },
  });
}

async function getDeliveryZone(branchId: bigint) {
  return prisma.restaurantDeliveryZone.findUnique({
    where: {
      branchId,
    },
  });
}

async function upsertDeliveryZone(
  branchId: bigint,
  data: {
    radiusKm: number;
    minimumDeliveryTimeMinutes: number;
    maximumDeliveryTimeMinutes: number;
  }
) {
  return prisma.restaurantDeliveryZone.upsert({
    where: {
      branchId,
    },

    create: {
      branchId,
      radiusKm: data.radiusKm,
      minimumDeliveryTimeMinutes:
        data.minimumDeliveryTimeMinutes,
      maximumDeliveryTimeMinutes:
        data.maximumDeliveryTimeMinutes,
    },

    update: {
      radiusKm: data.radiusKm,
      minimumDeliveryTimeMinutes:
        data.minimumDeliveryTimeMinutes,
      maximumDeliveryTimeMinutes:
        data.maximumDeliveryTimeMinutes,
    },
  });
}

export {
  createBranch,
  deactivateBranch,
  findBranchById,
  findBranchByIdAndRestaurant,
  findBranchesByRestaurant,
  updateBranch,
  getOperatingHours,
  replaceOperatingHours,
  updateOperatingHour,
  getDeliveryZone,
  upsertDeliveryZone
};