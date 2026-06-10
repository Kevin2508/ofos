import { createBranchDto, updateBranchDto } from "./branch.dto.ts";
import {
  createBranch,
  deactivateBranch,
  findBranchByIdAndRestaurant,
  findBranchesByRestaurant,
  updateBranch,
  getOperatingHours as getOperatingHoursRepo,
  replaceOperatingHours as replaceOperatingHoursRepo,
  updateOperatingHour as updateOperatingHourRepo,
  getDeliveryZone as getDeliveryZoneRepo,
  upsertDeliveryZone as upsertDeliveryZoneRepo
} from "./branch.repository.ts";

async function getBranchesService(restaurantId: bigint) {
  const branches = await findBranchesByRestaurant(restaurantId);
  return { branches };
}

async function createBranchService(
  restaurantId: bigint,
  body: createBranchDto
) {
  const branch = await createBranch({ restaurantId, ...body });
  return { branch };
}

async function getBranchService(restaurantId: bigint, id: bigint) {
  const branch = await findBranchByIdAndRestaurant(id, restaurantId);

  if (!branch) {
    throw new Error("Branch not found");
  }

  return { branch };
}

async function updateBranchService(
  restaurantId: bigint,
  id: bigint,
  body: updateBranchDto
) {
  const existing = await findBranchByIdAndRestaurant(id, restaurantId);

  if (!existing) {
    throw new Error("Branch not found");
  }

  const branch = await updateBranch(id, body);
  return { branch };
}

async function deactivateBranchService(
  restaurantId: bigint,
  id: bigint
) {
  const existing = await findBranchByIdAndRestaurant(id, restaurantId);

  if (!existing) {
    throw new Error("Branch not found");
  }

  const branch = await deactivateBranch(id);
  return { branch };
}

async function getOperatingHours(branchId: bigint) {
  const operatingHours : any = await getOperatingHoursRepo(branchId);
  return { operatingHours };
}

async function replaceOperatingHours(
  branchId: bigint,
  hours: any[]
) {
 const result = await replaceOperatingHoursRepo(
    branchId,
    hours
  );
  return { operatingHours: result };
}


async function updateOperatingHour(
  branchId: bigint,
  dayOfWeek: number,
  data: any
) {
  return updateOperatingHourRepo(
    branchId,
    dayOfWeek,
    data
  );
}


async function getDeliveryZone(branchId: bigint) {
  const deliveryZone = await getDeliveryZoneRepo(branchId);
  return { deliveryZone };
}

async function upsertDeliveryZone(
  branchId: bigint,
  data: {
    radiusKm: number;
    minimumDeliveryTimeMinutes: number;
    maximumDeliveryTimeMinutes: number;
  }
) {
  const result = await upsertDeliveryZoneRepo(
    branchId,
    data
  );
  return { deliveryZone: result };
}



export {
  createBranchService,
  deactivateBranchService,
  getBranchService,
  getBranchesService,
  updateBranchService,
  getOperatingHours,
  replaceOperatingHours,
  updateOperatingHour,
  getDeliveryZone,
  upsertDeliveryZone
};