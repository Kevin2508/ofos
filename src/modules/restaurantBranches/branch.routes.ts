import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import { validate } from "../../middlewares/validation.middleware.ts";
import {
  createBranch,
  deactivateBranch,
  getBranch,
  getBranches,
  updateBranch,
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

export { branchRouter };