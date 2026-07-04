import { catchAsync } from "../../middlewares/catch.async.ts";
import { Request, Response } from "express-serve-static-core";
import { updateModifierGroupSchema, createModifierOptionSchema, updateModifierOptionSchema, attachModifierGroupSchema } from "./modifier.validate.ts";
import {
  getAllModifierGroupsService, createModifierGroupService,
  updateModifierGroupService, deleteModifierGroupService, createModifierOptionService, updateModifierOptionService,
  deleteModifierOptionService, attachModifierGroupService, detachModifierGroupService
} from "./modifier.service.ts";

const getAllModifierGroups = catchAsync(
  async (req: Request, res: Response) => {

    const branchId = Number(req.params.id);

    if (isNaN(branchId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid Branch id',
      });
    }

    const result = await getAllModifierGroupsService(branchId);

    const serializedResult = JSON.parse(
      JSON.stringify(
        result,
        (_, value) =>
          typeof value === 'bigint'
            ? value.toString()
            : value
      )
    );

    return res.status(200).json({
      status: 'success',
      message: serializedResult.message,
      data: serializedResult.data
    });
  }
)

const createModifierGroup = catchAsync(
  async (req: Request, res: Response) => {

    const branchId = Number(req.params.id);

    if (isNaN(branchId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid branch id',
      });
    }

    const result = await createModifierGroupService(branchId, req.body);

    const serializedResult = JSON.parse(
      JSON.stringify(
        result,
        (_, value) =>
          typeof value === 'bigint'
            ? value.toString()
            : value
      )
    );

    return res.status(201).json({
      status: 'success',
      message: serializedResult.message,
      data: serializedResult.data,
    });
  }
)

const updateModifierGroup = catchAsync(
  async (req: Request, res: Response) => {

    const groupId = Number(req.params.id);

    if (isNaN(groupId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid Group id',
      });
    }

    const { error, value } =
      updateModifierGroupSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

    if (error) {
      return res.status(400).json({
        status: 'fail',
        errors: error.details.map(
          detail => detail.message
        ),
      });
    }

    const result = await updateModifierGroupService(groupId, value);

    const serializedResult = JSON.parse(
      JSON.stringify(
        result,
        (_, value) =>
          typeof value === 'bigint'
            ? value.toString()
            : value
      )
    );

    return res.status(serializedResult ? 200 : 404).json({
      message1: serializedResult.message,
      data: serializedResult.data,
    });

  }
)

const deleteModifierGroup = catchAsync(
  async (req: Request, res: Response) => {

    const modifierGroupId = Number(req.params.id);

    if (isNaN(modifierGroupId)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid modifier group id',
      });
    }

    const result = await deleteModifierGroupService(modifierGroupId);

    const serializedResult =
      JSON.parse(
        JSON.stringify(
          result,
          (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
        )
      );

    return res.status(serializedResult.data
      ? 200
      : 404
    ).json({
      status: serializedResult.data
        ? 'success'
        : 'fail',
      message: serializedResult.message,
      data: serializedResult.data,
    });
  }
);

const createModifierOption = catchAsync(
  async (req: Request, res: Response) => {

    const groupId = Number(req.params.groupId);

    if (isNaN(groupId)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid modifier group id',
      });
    }

    const { error, value } = createModifierOptionSchema.validate(
      req.body, {
      abortEarly: false,
      stripUnknown: true,
    }
    );

    if (error) {
      return res.status(400).json({
        status: 'fail',
        errors: error.details.map(
          detail => detail.message
        ),
      });
    }

    const result = await createModifierOptionService(groupId, value);

    const serializedResult =
      JSON.parse(
        JSON.stringify(
          result,
          (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
        )
      );

    return res.status(serializedResult.data ? 201 : 404).json({
      status: serializedResult.data ? 'success' : 'fail',
      message: serializedResult.message,
      data: serializedResult.data,
    });
  }
);

const updateModifierOption = catchAsync(
  async (req: Request, res: Response) => {

    const optionId = Number(req.params.id);

    if (isNaN(optionId)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid modifier option id',
      });
    }

    const { error, value } = updateModifierOptionSchema.validate(
      req.body, {
      abortEarly: false,
      stripUnknown: true,
    }
    );

    if (error) {
      return res.status(400).json({
        status: 'fail',
        errors: error.details.map(
          detail => detail.message
        ),
      });
    }

    const result = await updateModifierOptionService(optionId, value);

    const serializedResult =
      JSON.parse(
        JSON.stringify(
          result,
          (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
        )
      );

    return res.status(serializedResult.data ? 200 : 404).json({
      status: serializedResult.data ? 'success' : 'fail',
      message: serializedResult.message,
      data: serializedResult.data,
    });
  }
);

const deleteModifierOption = catchAsync(
  async (req: Request, res: Response) => {

    const optionId = Number(req.params.id);

    if (isNaN(optionId)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid modifier option id',
      });
    }

    const result = await deleteModifierOptionService(optionId);

    const serializedResult =
      JSON.parse(
        JSON.stringify(
          result,
          (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
        )
      );

    return res.status(serializedResult.data ? 200 : 404).json({
      status: serializedResult.data ? 'success' : 'fail',
      message: serializedResult.message,
      data: serializedResult.data,
    });
  }
);

const attachModifierGroup = catchAsync(
  async (req: Request, res: Response) => {

    const itemId = Number(req.params.itemId);

    if (isNaN(itemId)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid menu item id',
      });
    }

    const { error, value } = attachModifierGroupSchema.validate(
      req.body, {
      abortEarly: false,
      stripUnknown: true,
    }
    );

    if (error) {
      return res.status(400).json({
        status: 'fail',
        errors: error.details.map(
          detail => detail.message
        ),
      });
    }

    const result = await attachModifierGroupService(itemId, value.modifierGroupId);

    const serializedResult =
      JSON.parse(
        JSON.stringify(
          result,
          (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
        )
      );

    return res.status(serializedResult.data ? 201 : 404).json({
      status: serializedResult.data ? 'success' : 'fail',

      message: serializedResult.message,

      data: serializedResult.data,
    });
  }
);

const detachModifierGroup = catchAsync(
  async (req: Request, res: Response) => {

    const itemId = Number(req.params.itemId);

    const groupId = Number(req.params.groupId);

    if (isNaN(itemId)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid menu item id',
      });
    }

    if (isNaN(groupId)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Invalid modifier group id',
      });
    }

    const result = await detachModifierGroupService(itemId, groupId);

    const serializedResult =
      JSON.parse(
        JSON.stringify(
          result,
          (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
        )
      );

    return res.status(
      serializedResult.data ? 200 : 404)
      .json({
        status: serializedResult.data ? 'success' : 'fail',

        message: serializedResult.message,

        data: serializedResult.data,
      });
  }
);


export {
  getAllModifierGroups, createModifierGroup, updateModifierGroup, deleteModifierGroup, createModifierOption, updateModifierOption,
  deleteModifierOption,
  attachModifierGroup,
  detachModifierGroup
}