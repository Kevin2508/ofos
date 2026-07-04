import { RestaurantStatus } from "../../generated/prisma/enums.ts";
import { prisma } from "../../config/prisma.ts";
import type {
  createRestaurantDto,
  pauseRestaurantDto,
  updateRestaurantDto,
  uploadDocumentDto,
} from "./management.dto.ts";
import {
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
} from "./management.repository.ts";
import { createBranch } from "../restaurantBranches/branch.repository.ts";

async function registerRestaurantService(
  ownerUserId: bigint,
  data: createRestaurantDto
) {
  const restaurant = await createRestaurant({ ownerUserId, ...data });

  await createBranch({
    restaurantId: restaurant.id,
    branchName: `${data.businessName} — Main Branch`,
    gstin: 'PENDING',
    fssaiLicenseNumber: 'PENDING',
    contactPhone: data.primaryPhone,
    addressLine1: 'Address to be updated',
    city: 'City',
    state: 'State',
    postalCode: '000000',
    country: 'India',
    latitude: 0,
    longitude: 0,
    minimumOrderValue: 0,
    deliveryFee: 0,
  });

  return {
    message: "Restaurant registered successfully. Pending verification.",
    restaurant: serializeRestaurant(restaurant),
  };
}

async function getMyRestaurantsService(ownerUserId: bigint) {
  const restaurants = await findRestaurantsByOwner(ownerUserId);

  return {
    restaurants: restaurants.map(serializeRestaurant),
  };
}

async function updateRestaurantService(
  id: bigint,
  ownerUserId: bigint,
  data: updateRestaurantDto
) {
  const restaurant = await findRestaurantByIdAndOwner(id, ownerUserId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const updated = await updateRestaurant(id, data);

  return {
    message: "Restaurant updated successfully",
    restaurant: serializeRestaurant(updated),
  };
}

async function uploadLogoService(
  id: bigint,
  ownerUserId: bigint,
  logoUrl: string
) {
  const restaurant = await findRestaurantByIdAndOwner(id, ownerUserId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const updated = await updateRestaurantLogo(id, logoUrl);

  return {
    message: "Logo uploaded successfully",
    restaurant: serializeRestaurant(updated),
  };
}

async function uploadCoverService(
  id: bigint,
  ownerUserId: bigint,
  coverImageUrl: string
) {
  const restaurant = await findRestaurantByIdAndOwner(id, ownerUserId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const updated = await updateRestaurantCover(id, coverImageUrl);

  return {
    message: "Cover image uploaded successfully",
    restaurant: serializeRestaurant(updated),
  };
}

async function uploadDocumentService(
  id: bigint,
  ownerUserId: bigint,
  dto: uploadDocumentDto,
  documentUrl: string
) {
  const restaurant = await findRestaurantByIdAndOwner(id, ownerUserId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const doc = await addRestaurantDocument({
    restaurantId: id,
    documentType: dto.documentType,
    documentUrl,
  });

  return {
    message: "Document uploaded successfully",
    document: {
      ...doc,
      id: doc.id.toString(),
      restaurantId: doc.restaurantId.toString(),
      verifiedBy: doc.verifiedBy ? doc.verifiedBy.toString() : null,
    },
  };
}

async function pauseRestaurantService(
  id: bigint,
  ownerUserId: bigint,
  data: pauseRestaurantDto
) {
  const restaurant = await findRestaurantByIdAndOwner(id, ownerUserId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const updated = await setRestaurantStatus(id, RestaurantStatus.SUSPENDED);

  return {
    message: "Restaurant paused successfully",
    restaurant: serializeRestaurant(updated),
    resumeAt: data.resumeAt ? new Date(data.resumeAt) : null,
  };
}

async function resumeRestaurantService(id: bigint, ownerUserId: bigint) {
  const restaurant = await findRestaurantByIdAndOwner(id, ownerUserId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const updated = await setRestaurantStatus(id, RestaurantStatus.APPROVED);

  return {
    message: "Restaurant resumed successfully",
    restaurant: serializeRestaurant(updated),
  };
}

async function deactivateRestaurantService(id: bigint) {
  const restaurant = await findRestaurantById(id);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const updated = await softDeleteRestaurant(id);

  return {
    message: "Restaurant deactivated successfully",
    restaurant: serializeRestaurant(updated),
  };
}

async function getDashboardStatsService(ownerUserId: bigint) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const branches = await prisma.restaurantBranch.findMany({
    where: { restaurant: { ownerUserId } },
    select: { id: true }
  });
  const branchIds = branches.map(b => b.id);

  const todaysOrders = await prisma.order.findMany({
    where: {
      branchId: { in: branchIds },
      createdAt: { gte: startOfDay }
    }
  });

  const ordersToday = todaysOrders.length;
  const revenueToday = todaysOrders.filter(o => o.paymentStatus === 'PAID').reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const averageOrderValue = ordersToday > 0 ? revenueToday / ordersToday : 0;
  
  const acceptedOrders = todaysOrders.filter(o => !['PLACED', 'REJECTED', 'CANCELLED'].includes(o.orderStatus)).length;
  const acceptanceRate = ordersToday > 0 ? (acceptedOrders / ordersToday) * 100 : 0;

  const last7Days = new Date(startOfDay);
  last7Days.setDate(last7Days.getDate() - 6);

  const weekOrders = await prisma.order.findMany({
    where: {
      branchId: { in: branchIds },
      createdAt: { gte: last7Days }
    }
  });

  const revenueTrends = [];
  for (let i=0; i<7; i++) {
    const d = new Date(last7Days);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayOrders = weekOrders.filter(o => o.createdAt.getDate() === d.getDate() && o.paymentStatus === 'PAID');
    const rev = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    revenueTrends.push({ date: dateStr, revenue: rev });
  }

  return {
    ordersToday,
    revenueToday,
    averageOrderValue,
    acceptanceRate,
    revenueTrends
  };
}

async function getFinanceStatsService(ownerUserId: bigint) {
  const payouts = await prisma.restaurantPayout.findMany({
    where: {
      restaurant: {
        ownerUserId
      }
    },
    orderBy: { payoutPeriodEnd: 'desc' }
  });

  const pendingAmount = payouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
                               .reduce((sum, p) => sum + Number(p.netAmount), 0);
  
  const totalPaid = payouts.filter(p => p.status === 'PAID')
                           .reduce((sum, p) => sum + Number(p.netAmount), 0);
  
  const totalCommission = payouts.reduce((sum, p) => sum + Number(p.commissionAmount), 0);

  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  d.setHours(0,0,0,0);

  return {
    pendingAmount: pendingAmount.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    totalCommission: totalCommission.toFixed(2),
    nextPayoutDate: d.toDateString(),
    payouts: payouts.map(p => ({
      referenceId: p.payoutReference,
      periodStart: p.payoutPeriodStart,
      periodEnd: p.payoutPeriodEnd,
      grossAmount: Number(p.grossAmount).toFixed(2),
      commissionAmount: Number(p.commissionAmount).toFixed(2),
      netAmount: Number(p.netAmount).toFixed(2),
      status: p.status
    }))
  };
}


function serializeRestaurant(r: any) {
  return {
    ...r,
    id: r.id.toString(),
    ownerUserId: r.ownerUserId.toString(),
    approvedBy: r.approvedBy ? r.approvedBy.toString() : null,
  };
}

export {
  deactivateRestaurantService,
  getMyRestaurantsService,
  pauseRestaurantService,
  registerRestaurantService,
  resumeRestaurantService,
  updateRestaurantService,
  uploadCoverService,
  uploadDocumentService,
  uploadLogoService,
  getDashboardStatsService,
  getFinanceStatsService,
};