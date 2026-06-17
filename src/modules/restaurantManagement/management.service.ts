import { RestaurantStatus } from "../../generated/prisma/enums.ts";
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

  // Automatically create a default branch so the restaurant is usable immediately
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

// ─── Serialise BigInt fields ──────────────────────────────────────────────────

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
};