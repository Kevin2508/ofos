import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catch.async.ts";
import {
  branchParamsDto,
  createBranchDto,
  updateBranchDto,
} from "./branch.dto.ts";
import {
  createBranchService,
  deactivateBranchService,
  getBranchService,
  getBranchesService,
  updateBranchService,
  getOperatingHours as getOperatingHoursService,
  replaceOperatingHours as replaceOperatingHoursService,
  updateOperatingHour as updateOperatingHourService,
  getDeliveryZone as getDeliveryZoneService,
    upsertDeliveryZone as upsertDeliveryZoneService,
} from "./branch.service.ts";

// GET /restaurants/:restaurantId/branches
const getBranches = catchAsync(
  async (req: Request<Pick<branchParamsDto, "restaurantId">>, res: Response) => {
    const restaurantId = BigInt(req.params.restaurantId);
    const data = await getBranchesService(restaurantId);

    res.status(200).json({ status: "success", ...data });
  }
);

// POST /restaurants/:restaurantId/branches
const createBranch = catchAsync(
  async (
    req: Request<Pick<branchParamsDto, "restaurantId">, {}, createBranchDto>,
    res: Response
  ) => {
    const restaurantId = BigInt(req.params.restaurantId);
    const data = await createBranchService(restaurantId, req.body);

    res.status(201).json({ status: "success", ...data });
  }
);

// GET /restaurants/:restaurantId/branches/:id
const getBranch = catchAsync(
  async (req: Request<branchParamsDto>, res: Response) => {
    console.log(req.params.restaurantId)
    const restaurantId = BigInt(req.params.restaurantId);
    const id = BigInt(req.params.id);
    const data = await getBranchService(restaurantId, id);

    res.status(200).json({ status: "success", ...data });
  }
);

// PATCH /restaurants/:restaurantId/branches/:id
const updateBranch = catchAsync(
  async (
    req: Request<branchParamsDto, {}, updateBranchDto>,
    res: Response
  ) => {
    const restaurantId = BigInt(req.params.restaurantId);
    const id = BigInt(req.params.id);
    const data = await updateBranchService(restaurantId, id, req.body);

    res.status(200).json({ status: "success", ...data });
  }
);

// DELETE /restaurants/:restaurantId/branches/:id
const deactivateBranch = catchAsync(
  async (req: Request<branchParamsDto>, res: Response) => {
    const restaurantId = BigInt(req.params.restaurantId);
    const id = BigInt(req.params.id);
    const data = await deactivateBranchService(restaurantId, id);

    res.status(200).json({ status: "success", ...data });
  }
);

const getOperatingHours = catchAsync(
  async (req: Request<branchParamsDto>, res: Response) => {
    const branchId = BigInt(req.params.branchId);

  const hours =
    await getOperatingHoursService(branchId);

  return res.status(200).json({
    success: true,
    data: hours,
  });
});

const replaceOperatingHours = catchAsync(
  async (req: Request<branchParamsDto>, res: Response) => {
    const branchId = BigInt(req.params.branchId);

  await replaceOperatingHoursService(
    branchId ,
    req.body.hours
  );

  return res.status(200).json({
    success: true,
    message:
      "Operating hours updated successfully",
  });
});

const updateOperatingHour = catchAsync(
  async (req: Request<branchParamsDto>, res: Response) => {
    const branchId = BigInt(req.params.branchId);

  const dayOfWeek =
    Number(req.params.dayOfWeek);

  const result =
    await updateOperatingHourService(
      branchId,
      dayOfWeek,
      req.body
    );

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const getDeliveryZone = catchAsync(
  async (req: Request<branchParamsDto>, res: Response) => {
const branchId = BigInt(req.params.branchId);

  const zone =
    await getDeliveryZoneService(branchId);

  return res.status(200).json({
    success: true,
    data: zone,
  });
  });


const upsertDeliveryZone = catchAsync(
  async (req: Request<branchParamsDto>, res: Response) => {
    const branchId = BigInt(req.params.branchId);

  const zone =
    await upsertDeliveryZoneService(
      branchId,
      req.body
    );

  return res.status(200).json({
    success: true,
    data: zone,
  });
});

export {
  getBranches,
  createBranch,
  getBranch,
  updateBranch,
  deactivateBranch,
  getOperatingHours,
  replaceOperatingHours,
  updateOperatingHour,
  getDeliveryZone,
  upsertDeliveryZone
};

