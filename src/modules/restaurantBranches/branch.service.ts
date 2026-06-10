import { createBranchDto, updateBranchDto } from "./branch.dto.ts";
import {
  createBranch,
  deactivateBranch,
  findBranchByIdAndRestaurant,
  findBranchesByRestaurant,
  updateBranch,
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

export {
  createBranchService,
  deactivateBranchService,
  getBranchService,
  getBranchesService,
  updateBranchService,
};