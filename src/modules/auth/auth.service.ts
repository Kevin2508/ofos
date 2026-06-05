import bcrypt from 'bcryptjs';
import { createUser, getUserByNameOrMail } from '../user/user.repository.ts';
import { registerDto } from './auth.dto.ts';
import { IfunctionReturn } from './auth.interface.ts';

async function registerService(data: registerDto): Promise<IfunctionReturn> {
  const { user } = await getUserByNameOrMail(data.userName, data.email);
  if (user) throw new Error('Username or email is already in use');

  const salt = Number(process.env.PASSWORD_HASH_SALT);
  const hashedPassword = bcrypt.hashSync(data.password, salt);

  const profilePictureUrl =
    files?.profilePicture?.[0].path || 'images/user.png';
  const coverPictureUrl = files?.coverPicture?.[0].path || 'images/cover.jpg';

  const insertData: string[] = [
    data.userName,
    hashedPassword,
    data.fullName,
    data.bio,
    data.email,
    data.contact || '',
    data.website,
    data.birthDate,
    data.location,
    profilePictureUrl,
    coverPictureUrl,
    data.timeZone,
  ];

  await createUser(insertData);

  return { message: 'User created successfully' };
}

// async function googleAuthCallbackService(
//   user: IjwtUser,
// ): Promise<IfunctionReturn> {
//   const { email, name } = user;
//   const fullName = name?.givenName + (name?.familyName ? name?.familyName : "");

//   let data = await getUserByMail(email as string);

//   if (!data.user) {
//     const userName = await getUniqueName(name?.givenName as string);

//     const insertData: string[] = [userName, fullName, email as string, "UTC"];

//     await createGoogleUser(insertData);

//     data = await getUserByMail(email as string);
//   }

//   const jwtLife = process.env.JWT_EXPIRE || "1d";
//   const jwtSecret = process.env.JWT_SECRET as string;

//   const payload: IjwtUser = {
//     id: data.user?.user_id as string,
//     userName: data.user?.user_name as string,
//     timeZone: data.user?.time_zone as string,
//   };

//   const token = jwt.sign(payload, jwtSecret, {
//     expiresIn: jwtLife as StringValue,
//   });

//   return { message: "User logged in successfully", token };
// }

// async function loginService(data: loginDto): Promise<IfunctionReturn> {
//   const { user } = await getUserByUserIdentifier(data.userIdentifier);
//   if (!user) throw new Error("Invalid credential");

//   const isMatch = bcrypt.compareSync(data.password, user.u_password);
//   if (!isMatch) throw new Error("Invalid credential");

//   let jwtLife = process.env.JWT_EXPIRE || "1d";
//   const jwtSecret = process.env.JWT_SECRET || "twitter_jwt_secret";

//   if (data.rememberMe && data.rememberMe === "True")
//     jwtLife = process.env.JWT_EXPIRE_REMEMBER_ME || "7d";

//   const payload: IjwtUser = {
//     id: user.user_id,
//     userName: user.user_name,
//     timeZone: user.time_zone,
//   };

//   const token = jwt.sign(payload, jwtSecret, {
//     expiresIn: jwtLife as StringValue,
//   });

//   return { message: "User logged in successfully", token };
// }

// async function forgotPasswordService(
//   data: forgotPasswordDto,
// ): Promise<IfunctionReturn> {
//   const { user } = await getUserByUserIdentifier(data.userIdentifier);
//   if (!user)
//     throw new Error(
//       "If valid credential reset password link is sent to registered email",
//     );

//   const resetToken = crypto.randomBytes(32).toString("hex");
//   const hashedResetToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   const minutes = Number(process.env.RESET_TOKEN_EXPIRE);
//   const expiresAt = new Date(Date.now() + minutes * 60 * 1000)
//     .toISOString()
//     .slice(0, 19)
//     .replace("T", " ");

//   const insertData = [user.user_id, hashedResetToken, expiresAt];

//   await storeResetToken(insertData);

//   const link = `http://localhost:${env.PORT}/resetPasswordPage/${resetToken}`;

//   return {
//     message:
//       "If valid credential reset password link is sent to registered email",
//     link,
//   };
// }

// async function resetPasswordService(
//   data: resetPasswordDto,
//   params: resetPasswordParamsDto,
// ): Promise<IfunctionReturn> {
//   const hashedResetToken = crypto
//     .createHash("sha256")
//     .update(params.resetToken)
//     .digest("hex");

//   const res = await findDataByToken(hashedResetToken);
//   if (!res.data) throw new Error("Invalid token");

//   if (new Date() > new Date(res.data.expires_at + "Z"))
//     throw new Error("Token expired");

//   const { user } = await getUserById(Number(res.data.user_id));
//   if (!user) throw new Error("User not exists");

//   const isMatch = bcrypt.compareSync(data.password, user.u_password);
//   if (isMatch) throw new Error("New password should not be current password");

//   const salt = Number(process.env.PASSWORD_HASH_SALT);
//   const hashedPassword = bcrypt.hashSync(data.password, salt);

//   await deleteTokenById(Number(res.data.reset_token_id));

//   await resetUserPassword(hashedPassword, Number(user.user_id));

//   return { message: "Password reseted successfully" };
// }

// async function sendOtpService(data: sendOtpDto): Promise<IfunctionReturn> {
//   const otp = String(crypto.randomInt(100000, 999999));

//   const salt = Number(process.env.OTP_HASH_SALT);
//   const hashedOtp = bcrypt.hashSync(otp, salt);

//   const minutes = Number(process.env.OTP_EXPIRE);
//   const expiresAt = new Date(Date.now() + minutes * 60 * 1000)
//     .toISOString()
//     .slice(0, 19)
//     .replace("T", " ");

//   const insertData = [data.email, hashedOtp, expiresAt];
//   await storeOtp(insertData);

//   return { message: "Otp send successfully", otp };
// }

// async function verigyOtpService(data: verigyOtpDto): Promise<IfunctionReturn> {
//   const { email, otp } = data;

//   const res = await findOtpByEmail(email);
//   if (!res.data) throw new Error("Otp expired");

//   if (new Date() > new Date(res.data.expires_at + "Z")) {
//     await deleteOtpById(Number(res.data.otp_id));
//     throw new Error("Otp expired!");
//   }

//   const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS);
//   if (Number(res.data.attempts) >= maxAttempts) {
//     await deleteOtpById(Number(res.data.otp_id));
//     throw new Error("Max attempts exceeded");
//   }

//   const isMatch = bcrypt.compareSync(otp, res.data.otp as string);
//   if (!isMatch) {
//     updateOtpAttempts(Number(res.data.otp_id));
//     throw new Error("Invalid otp");
//   }

//   await deleteOtpById(Number(res.data.otp_id));

//   return { message: "Otp verified successfully" };
// }

export { registerService };
