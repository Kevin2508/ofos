import { prisma } from "../../config/prisma.ts";
import { DocumentType, RestaurantStatus } from "../../generated/prisma/enums.ts";

async function createRestaurantOwner(data: { userId: bigint }) {
  return await prisma.restaurant.create({
    data: {
      ownerUserId: data.userId,
      businessName: '',
      legalBusinessName: '',
      primaryPhone: '',
      primaryEmail: '',
      status: 'PENDING_VERIFICATION',
    },
  });
}

async function createRestaurant(data: {
  ownerUserId: bigint;
  businessName: string;
  legalBusinessName: string;
  primaryPhone: string;
  primaryEmail: string;
  description?: string;
}) {
  return prisma.restaurant.create({
    data: {
      ...data,
      status: RestaurantStatus.PENDING_VERIFICATION,
    },
  });
}

async function findRestaurantsByOwner(ownerUserId: bigint) {
  return prisma.restaurant.findMany({
    where: { ownerUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

async function findRestaurantById(id: bigint) {
  return prisma.restaurant.findFirst({
    where: { id, deletedAt: null },
  });
}

async function findRestaurantByIdAndOwner(id: bigint, ownerUserId: bigint) {
  return prisma.restaurant.findFirst({
    where: { id, ownerUserId, deletedAt: null },
  });
}

async function updateRestaurant(
  id: bigint,
  data: {
    businessName?: string;
    description?: string;
    primaryPhone?: string;
    primaryEmail?: string;
  }
) {
  return prisma.restaurant.update({ where: { id }, data });
}

async function updateRestaurantLogo(id: bigint, logoUrl: string) {
  return prisma.restaurant.update({
    where: { id },
    data: { logoUrl },
  });
}

async function updateRestaurantCover(id: bigint, coverImageUrl: string) {
  return prisma.restaurant.update({
    where: { id },
    data: { coverImageUrl },
  });
}

async function setRestaurantStatus(id: bigint, status: RestaurantStatus) {
  return prisma.restaurant.update({
    where: { id },
    data: { status },
  });
}

async function softDeleteRestaurant(id: bigint) {
  return prisma.restaurant.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

async function addRestaurantDocument(data: {
  restaurantId: bigint;
  documentType: DocumentType;
  documentUrl: string;
}) {
  return prisma.restaurantDocument.create({ data });
}

export {
  createRestaurantOwner,
  addRestaurantDocument,
  createRestaurant,
  findRestaurantById,
  findRestaurantByIdAndOwner,
  findRestaurantsByOwner,
  setRestaurantStatus,
  softDeleteRestaurant,
  updateRestaurant,
  updateRestaurantCover,
  updateRestaurantLogo,
};