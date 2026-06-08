import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import { validate } from "../../middlewares/validation.middleware.ts";
import {
  createBranch,
  deactivateBranch,
  getBranch,
  getBranches,
  updateBranch,
<<<<<<< HEAD
  getOperatingHours,
  replaceOperatingHours,
  updateOperatingHour,
  upsertDeliveryZone,
  getDeliveryZone,
=======
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
} from "./branch.controller.ts";
import {
  createBranchSchema,
  updateBranchSchema,
} from "./branch.validation.ts";

const branchRouter = Router({ mergeParams: true });

branchRouter.get("/", authenticate, getBranches);

branchRouter.post(
  "/",
  authenticate,
  validate(createBranchSchema),
  createBranch
);

branchRouter.get("/:id", authenticate, getBranch);

branchRouter.patch(
  "/:id",
  authenticate,
  validate(updateBranchSchema),
  updateBranch
);

branchRouter.delete("/:id", authenticate, deactivateBranch);

<<<<<<< HEAD
branchRouter.get("/:branchId/hours", getOperatingHours); 

branchRouter.put(
  "/:branchId/hours",
  replaceOperatingHours
);

branchRouter.patch(
  "/:branchId/hours/:dayOfWeek",
  updateOperatingHour
);

branchRouter.get(
  "/:branchId/delivery-zone",
  getDeliveryZone
);

branchRouter.put(
  "/:branchId/delivery-zone",
  upsertDeliveryZone
);

=======
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
export { branchRouter };