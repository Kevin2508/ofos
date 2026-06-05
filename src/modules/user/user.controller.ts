import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catch.async.ts";
import {
  IchangePasswordDto,
  IcheckEmail,
  IcheckUsername,
  IeditUserProfileDto,
  IserachParamsDto,
} from "./user.dto.ts";
import {
  changePasswordService,
  checkEmailService,
  checkUsernameService,
  deleteUserService,
  editUserProfileService,
  getJoiningDataService,
  getUserByIdService,
  getUserService,
  searchUserService,
} from "./user.service.ts";

const editUserProfile = catchAsync(
  async (req: Request<{}, {}, IeditUserProfileDto>, res: Response) => {
    await editUserProfileService(req.body, req.files, req.user?.id as string);

    res.status(200).json({ status: "success", message: "data.message" });
  },
);

const changePassword = catchAsync(
  async (req: Request<{}, {}, IchangePasswordDto>, res: Response) => {
    const data = await changePasswordService(req.body, req.user?.id as string);

    res.status(200).json({ status: "success", message: data.message });
  },
);

const searchUser = catchAsync(
  async (req: Request<IserachParamsDto>, res: Response) => {
    const resp = await searchUserService(req.params);

    res
      .status(200)
      .json({ status: "success", message: resp.message, data: resp.data });
  },
);

const getUser = catchAsync(async (req: Request, res: Response) => {
  const resp = await getUserService(req.user?.id as string);

  res
    .status(200)
    .json({ status: "success", message: resp.message, user: resp.user || {} });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const resp = await getUserByIdService(
    req.params?.userId as string,
    req.user?.id as string,
  );

  res
    .status(200)
    .json({ status: "success", message: resp.message, user: resp.user || {} });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const data = await deleteUserService(req.user?.id as string);

  res.status(200).json({ status: "success", message: data.message });
});

const getJoiningData = catchAsync(async (req: Request, res: Response) => {
  const resp = await getJoiningDataService(req.user?.id as string);

  res
    .status(200)
    .json({ status: "success", message: resp.message, data: resp.data });
});

const checkEmailAvailable = catchAsync(
  async (req: Request<{}, {}, IcheckEmail>, res: Response) => {
    const resp = await checkEmailService(req.body);

    res.status(200).json({
      status: "success",
      message: resp.message,
      isAvailable: resp.isAvailable,
    });
  },
);

const checkUsernameAvailable = catchAsync(
  async (req: Request<{}, {}, IcheckUsername>, res: Response) => {
    const resp = await checkUsernameService(req.body);

    res.status(200).json({
      status: "success",
      message: resp.message,
      isAvailable: resp.isAvailable,
    });
  },
);

export {
  changePassword,
  checkEmailAvailable,
  checkUsernameAvailable,
  deleteUser,
  editUserProfile,
  getJoiningData,
  getUser,
  getUserById,
  searchUser,
};
