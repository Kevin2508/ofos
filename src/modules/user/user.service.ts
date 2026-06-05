import bcrypt from "bcryptjs";
import {
  IchangePasswordDto,
  IcheckEmail,
  IcheckUsername,
  IeditUserProfileDto,
  IserachParamsDto,
} from "./user.dto.ts";
import { IfunctionReturn } from "./user.interface.ts";
import {
  deleteUser,
  getIsFollowed,
  getJoiningDataById,
  getUserById,
  isEmailAvailable,
  isUsernameAvailable,
  resetUserPassword,
  searchUser,
  updateUserProfile,
} from "./user.repository.ts";

async function editUserProfileService(
  data: IeditUserProfileDto,
  files: {
    profilePicture?: [{ path: string }];
    coverPicture?: [{ path: string }];
  },
  userId: string,
): Promise<IfunctionReturn> {
  const res = await getUserById(Number(userId));

  const profilePictureUrl =
    files?.profilePicture?.[0].path ||
    res.user?.profile_picture ||
    "images/user.png";

  const coverPictureUrl =
    files?.coverPicture?.[0].path ||
    res.user?.cover_picture ||
    "images/cover.jpg";

  const insertData: string[] = [
    profilePictureUrl,
    coverPictureUrl,
    data.fullName || "",
    data.bio || "",
    data.location || "",
    data.website || "",
    data.birthDate || "",
    userId,
  ];

  await updateUserProfile(insertData);

  return { message: "User created successfully" };
}

async function changePasswordService(
  data: IchangePasswordDto,
  userId: string,
): Promise<IfunctionReturn> {
  const { user } = await getUserById(Number(userId));
  if (!user) throw new Error("User not exists");

  const isMatch = bcrypt.compareSync(data.currentPassword, user.u_password);
  if (!isMatch) throw new Error("Current password is wrong");

  const isMatch2 = bcrypt.compareSync(data.newPassword, user.u_password);
  if (!isMatch2)
    throw new Error("New password should be different from current one");

  const salt = Number(process.env.PASSWORD_HASH_SALT);
  const hashedPassword = bcrypt.hashSync(data.newPassword, salt);

  await resetUserPassword(hashedPassword, Number(userId));

  return { message: "Password changed successfully" };
}

async function deleteUserService(userId: string): Promise<IfunctionReturn> {
  await deleteUser(Number(userId));

  return { message: "User deleted successfully" };
}

async function getJoiningDataService(userId: string): Promise<IfunctionReturn> {
  const { data } = await getJoiningDataById(Number(userId));

  return { message: "Joining data fetched successfully", data: data || [] };
}

async function searchUserService(
  params: IserachParamsDto,
): Promise<IfunctionReturn> {
  const { data } = await searchUser(params.searchString);

  return { message: "Users found", data: data || [] };
}

async function getUserService(userId: string): Promise<IfunctionReturn> {
  const res = await getUserById(Number(userId));

  return res;
}

async function getUserByIdService(
  userId: string,
  userId2: string,
): Promise<IfunctionReturn> {
  const res = await getUserById(Number(userId));

  if (res.user) {
    const res1 = await getIsFollowed(Number(userId2), Number(userId));

    res.user.isFollowed = res1.followed as boolean;
  }

  return res;
}

async function checkEmailService(data: IcheckEmail): Promise<IfunctionReturn> {
  const res = await isEmailAvailable(data.email);
  return res;
}

async function checkUsernameService(
  data: IcheckUsername,
): Promise<IfunctionReturn> {
  const res = await isUsernameAvailable(data.userName);
  return res;
}

export {
  changePasswordService,
  deleteUserService,
  editUserProfileService,
  getJoiningDataService,
  searchUserService,
  checkEmailService,
  getUserService,
  checkUsernameService,
  getUserByIdService,
};
