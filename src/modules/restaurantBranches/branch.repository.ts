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

export {
  createBranch,
  deactivateBranch,
  findBranchById,
  findBranchByIdAndRestaurant,
  findBranchesByRestaurant,
  updateBranch,
};