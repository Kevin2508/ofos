import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserByEmail,
  findUserByEmailOrContact,
  findUserByIdentifier,
  updateUser,
} from '../user/user.repository.ts';
import {
  forgotPasswordDto,
  loginDto,
  registerDto,
  resetPasswordDto,
  resetPasswordParamsDto,
  sendOtpDto,
  verigyOtpDto,
} from './auth.dto.ts';
import { IfunctionReturn } from './auth.interface.ts';
import {
  saveOtp,
  getOtp,
  deleteOtp,
  storeResetToken,
  deleteResetToken,
  getOtpByEmail,
} from './auth.repository.ts';

async function registerService(data: registerDto) {
  const existingUser = await findUserByEmailOrContact(data.email, data.phone);

  if (existingUser) {
    throw new Error('Username or email is already in use');
  }

  const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  await createUser({
    firstName: data.firstName,
    email: data.email,
    phone: data.phone,
    passwordHash: hashedPassword,
  });

  return {
    message: 'User created successfully',
  };
}

async function loginService(data: loginDto): Promise<IfunctionReturn> {
  const user = await findUserByIdentifier(data.userIdentifier);
  if (!user) throw new Error('Invalid credential');

  const isMatch = bcrypt.compareSync(
    data.password,
    user.passwordHash as string
  );
  if (!isMatch) throw new Error('Invalid credential');

  const jwtLife = (process.env.JWT_EXPIRE || '1d') as any;
  const jwtLifeRemember = (process.env.JWT_EXPIRE_REMEMBER_ME || '7d') as any;

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET || 'ofos_secret_5000',
    { expiresIn: data.rememberMe === 'True' ? jwtLifeRemember : jwtLife }
  );

  return {
    message: 'User logged in successfully',
    token,
  };
}

async function forgotPasswordService(
  data: forgotPasswordDto
): Promise<IfunctionReturn> {
  const user = await findUserByIdentifier(data.userIdentifier);

  if (!user) {
    return {
      message:
        'If valid credential reset password link is sent to registered email',
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const expiresAt = new Date(
    Date.now() + Number(process.env.RESET_TOKEN_EXPIRE) * 60 * 1000
  );

  await storeResetToken({
    userId: user.id,
    otpCode: hashedToken,
    expiresAt,
    purpose: 'PASSWORD_RESET',
  });

  return {
    message:
      'If valid credential reset password link is sent to registered email',
    link: `http://localhost:${process.env.PORT}/resetPasswordPage/${resetToken}`,
  };
}

async function resetPasswordService(
  data: resetPasswordDto,
  params: resetPasswordParamsDto
): Promise<IfunctionReturn> {
  const hashedToken = crypto
    .createHash('sha256')
    .update(params.resetToken)
    .digest('hex');

  const tokenRecord = await getOtp({ otpHash: hashedToken });
  if (!tokenRecord) throw new Error('Invalid token');

  if (!tokenRecord.email) {
    throw new Error('Email not found in OTP record');
  }

  const email = tokenRecord.email;

  const user = await findUserByEmail(email);

  if (!user) throw new Error('User not exists');

  const isSamePassword = bcrypt.compareSync(
    data.password,
    user.passwordHash as string
  );
  if (isSamePassword)
    throw new Error('New password should not be current password');

  const hashedPassword = bcrypt.hashSync(
    data.password,
    Number(process.env.PASSWORD_HASH_SALT)
  );

  await deleteResetToken({ id: tokenRecord.id });

  await updateUser({
    userId: user.id,
    data: {
      passwordHash: hashedPassword,
    },
  });

  return { message: 'Password reset successfully' };
}

async function sendOtpService(data: sendOtpDto): Promise<IfunctionReturn> {
  const otp = String(crypto.randomInt(100000, 999999));

  const hashedOtp = bcrypt.hashSync(otp, Number(process.env.OTP_HASH_SALT));

  const expiresAt = new Date(
    Date.now() + Number(process.env.OTP_EXPIRE) * 60 * 1000
  );

  await saveOtp({
    email: data.email,
    otpCode: hashedOtp,
    purpose: 'PHONE_VERIFICATION',
    expiresAt,
  });

  return {
    message: 'Otp sent successfully',
    otp, // usually NOT returned in production
  };
}

async function verifyOtpService(data: verigyOtpDto): Promise<IfunctionReturn> {
  const otpRecord = await getOtpByEmail(data.email);

  if (!otpRecord) throw new Error('Otp expired');

  const isMatch = bcrypt.compareSync(data.otp, otpRecord.otpCode);

  if (!isMatch) {
    throw new Error('Invalid otp');
  }

  await deleteOtp(otpRecord.id);

  return { message: 'Otp verified successfully' };
}

export {
  forgotPasswordService,
  loginService,
  registerService,
  resetPasswordService,
  sendOtpService,
  verifyOtpService,
};
