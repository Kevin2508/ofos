import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import { validate } from "../../middlewares/validation.middleware.ts";
import { changePasswordSchema, editUserSchema } from "./user.validation.ts";
import {
  changePassword,
  checkEmailAvailable,
  checkUsernameAvailable,
  deleteUser,
  editUserProfile,
  getJoiningData,
  getUser,
  getUserById,
  searchUser,
} from "./user.controller.ts";
import { upload } from "../../middlewares/upload.middleware.ts";

const userRouter = Router();

userRouter.post("/email-available", checkEmailAvailable);

userRouter.post("/username-available", checkUsernameAvailable);

userRouter.use(authenticate);

userRouter.get("/get", getUser);

userRouter.get("/get/:userId", getUserById);

userRouter.put(
  "/edit",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPicture", maxCount: 1 },
  ]),
  validate(editUserSchema),
  editUserProfile,
);

userRouter.put(
  "/change-password",
  validate(changePasswordSchema),
  changePassword,
);

userRouter.get("/search/:searchString", searchUser);

userRouter.delete("/delete", deleteUser);

userRouter.get("/joining-data", getJoiningData);

export { userRouter };
