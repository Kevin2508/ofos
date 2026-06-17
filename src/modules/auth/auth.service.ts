import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import {
  assignRole,
  createUser,
  findUserByContact,
  findUserByIdentifier,
  findUserForAuth,
  getRoleIdByRole,
  handleSuccessfulLogin,
  incrementFailedLoginAttempts,
  lockUserAccount,
  markUserIsVerified,
  revokeAllUserSessions,
  updateUser,
} from '../user/user.repository.ts';
import { forgotPasswordDto, loginDto, registerDto } from './auth.dto.ts';
import { IfunctionReturn } from './auth.interface.ts';
import {
  createUserSession,
  deleteOtp,
  deleteResetToken,
  getToken,
  getValidOtpByEmail,
  getValidOtpByPhone,
  getValidResetRecordByPhone,
  getValidSessionWithUserByTokenHash,
  saveOtp,
  storeResetToken,
} from './auth.repository.ts';
import { createDeliveryPartner } from '../deliveryPartner/deliveryPartner.repository.ts';
import { createRestaurantOwner } from '../restaurantManagement/management.repository.ts';

const MAX_LOGIN_ATTEMPTS = 5;
const GENERIC_AUTH_ERROR = 'Invalid credentials provided';
const GENERIC_RESET_MSG =
  'If a valid account exists, instructions have been sent to your registered contact method.';

async function loginService(
  data: loginDto,
  reqMeta: { ipAddress?: string; userAgent?: string }
) {
  const user = await findUserForAuth(data.userIdentifier);

  if (!user) {
    throw new Error(GENERIC_AUTH_ERROR);
  }
  if (user.status !== 'ACTIVE') {
    throw new Error('Account is not active. Please contact support.');
  }

  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await lockUserAccount(user.id);
    throw new Error(
      'Account temporarily locked due to too many failed attempts.'
    );
  }

  if (!user.passwordHash) throw new Error(GENERIC_AUTH_ERROR);
  const isMatch = await bcrypt.compare(data.password, user.passwordHash);

  if (!isMatch) {
    await incrementFailedLoginAttempts(user.id);
    throw new Error(GENERIC_AUTH_ERROR);
  }

  await handleSuccessfulLogin(user.id);

  // Flatten Roles and Permissions for JWT Payload
  const roles = new Set<string>();
  const pendingRoles = new Set<string>();
  const permissions = new Set<string>();

  user.userRoles.forEach((ur) => {
    if (ur.status === 'ASSIGNED') {
      roles.add(ur.role.name);

      ur.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.code);
      });
    } else if (ur.status === 'REQUESTED') {
      pendingRoles.add(ur.role.name);
    }
  });

  // Generate Short-Lived Access Token
  const accessTokenLife = (process.env.JWT_ACCESS_EXPIRE ||
    '1d') as StringValue;
  const accessToken = jwt.sign(
    {
      id: String(user.id),
      email: user.email,
      roles: Array.from(roles),
      pendingRoles: Array.from(pendingRoles),
      permissions: Array.from(permissions),
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: accessTokenLife }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const refreshExpiresInDays =
    data.rememberMe === 'True'
      ? Number(process.env.JWT_REFRESH_EXPIRE_REMEMBER_ME || 30)
      : Number(process.env.JWT_REFRESH_EXPIRE || 5);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

  await createUserSession({
    userId: user.id,
    refreshTokenHash,
    ipAddress: reqMeta.ipAddress || '',
    userAgent: reqMeta.userAgent || '',
    deviceName: '',
    expiresAt,
  });

  return {
    message: 'User logged in successfully',
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: accessTokenLife,
    },
    user: {
      id: String(user.id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: Array.from(roles),
    },
  };
}

async function forgotPasswordService(
  data: forgotPasswordDto
): Promise<IfunctionReturn> {
  const isEmail = data.userIdentifier.includes('@');
  const user = await findUserByIdentifier(data.userIdentifier);

  if (!user) {
    return { message: GENERIC_RESET_MSG };
  }

  if (isEmail) {
    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + Number(process.env.RESET_TOKEN_EXPIRE || 15) * 60 * 1000
    );

    await storeResetToken({
      email: user.email,
      phone: null,
      otpHash: hashedToken,
      expiresAt,
      purpose: 'PASSWORD_RESET',
    });

    return {
      message: GENERIC_RESET_MSG,
      link: `http://localhost:${process.env.PORT}/resetPasswordPage?resetToken=${resetToken}`,
    };
  } else {
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(
      otp,
      Number(process.env.OTP_HASH_SALT || 10)
    );
    const expiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRE || 10) * 60 * 1000
    );

    await storeResetToken({
      email: null,
      phone: user.phone,
      otpHash: hashedOtp,
      expiresAt,
      purpose: 'PASSWORD_RESET',
    });

    return { message: GENERIC_RESET_MSG, otp };
  }
}

async function resetPasswordService(data: any, params: { resetToken: string }) {
  const tokenString = params.resetToken;

  const isOtpFlow = tokenString.length === 6 && /^\d+$/.test(tokenString);

  let user;
  let recordId;

  if (isOtpFlow) {
    if (!data.userIdentifier) {
      throw new Error('Phone number is required when resetting via OTP.');
    }

    const otpRecord = await getValidResetRecordByPhone(
      data.userIdentifier,
      'PASSWORD_RESET'
    );

    if (!otpRecord) throw new Error('Invalid or expired OTP');

    const isMatch = await bcrypt.compare(tokenString, otpRecord.otpHash);
    if (!isMatch) throw new Error('Invalid OTP');

    user = await findUserByIdentifier(data.userIdentifier);
    recordId = otpRecord.id;
  } else {
    const hashedToken = crypto
      .createHash('sha256')
      .update(tokenString)
      .digest('hex');
    const tokenRecord = await getToken({ otpHash: hashedToken });

    if (!tokenRecord || !tokenRecord.email)
      throw new Error('Invalid or expired reset link');

    user = await findUserByIdentifier(tokenRecord.email);
    recordId = tokenRecord.id;
  }

  if (!user) throw new Error('User does not exist');

  const isSamePassword = await bcrypt.compare(
    data.password,
    user.passwordHash as string
  );
  if (isSamePassword) {
    throw new Error('New password must be different from the current password');
  }

  const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  await updateUser({
    userId: user.id,
    data: { passwordHash: hashedPassword },
  });

  await deleteResetToken({ id: recordId });
  await revokeAllUserSessions(user.id);

  return {
    message:
      'Password reset successfully. Please log in with your new password.',
  };
}

async function sendOtpService(data: { email?: string; phone?: string }) {
  if (!data.email && !data.phone) {
    throw new Error('Either email or phone is required to send OTP');
  }

  const isEmailFlow = !!data.email;
  const purpose = isEmailFlow ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION';

  const otp = crypto.randomInt(100000, 999999).toString();
  const saltRounds = Number(process.env.OTP_HASH_SALT || 10);
  const hashedOtp = await bcrypt.hash(otp, saltRounds);

  const expiresAt = new Date(
    Date.now() + Number(process.env.OTP_EXPIRE || 5) * 60 * 1000
  );

  await saveOtp({
    email: data.email || null,
    phone: data.phone || null,
    otpHash: hashedOtp,
    purpose,
    expiresAt,
  });

  if (isEmailFlow) {
    // Send email
    // await emailService.send(data.email, `Your verification code is ${otp}`);
  } else {
    // Send SMS
    // await smsService.send(data.phone, `Your verification code is ${otp}`);
  }

  return {
    message: `${isEmailFlow ? 'Email' : 'Phone'} OTP sent successfully`,
    otp,
  };
}

async function verifyOtpService(data: {
  email?: string;
  phone?: string;
  otp: string;
}) {
  if (!data.email && !data.phone) {
    throw new Error('Either email or phone is required to verify OTP');
  }
  const isEmailFlow = !!data.email;
  const purpose = isEmailFlow ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION';

  let otpRecord;

  if (isEmailFlow) {
    otpRecord = await getValidOtpByEmail(data.email!, purpose);
  } else {
    otpRecord = await getValidOtpByPhone(data.phone!, purpose);
  }

  if (!otpRecord) {
    throw new Error('Invalid or expired OTP');
  }

  const isMatch = await bcrypt.compare(data.otp, otpRecord.otpHash);
  if (!isMatch) {
    throw new Error('Invalid OTP');
  }

  const identifier = isEmailFlow ? data.email! : data.phone!;
  const user = await findUserByIdentifier(identifier);

  if (user) {
    await markUserIsVerified({
      userId: user.id,
      type: isEmailFlow ? 'email' : 'phone',
    });
  }

  await deleteOtp(otpRecord.id);

  return {
    message: `${isEmailFlow ? 'Email' : 'Phone'} verified successfully`,
  };
}

async function refreshTokenService(rawRefreshToken: string) {
  if (!rawRefreshToken) {
    throw new Error('No refresh token provided');
  }

  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

  const session = await getValidSessionWithUserByTokenHash(hashedRefreshToken);

  if (!session || !session.user) {
    throw new Error('Invalid or expired refresh session');
  }

  if (session.user.status !== 'ACTIVE') {
    throw new Error('Account is no longer active');
  }

  const roles = new Set<string>();
  const permissions = new Set<string>();

  session.user.userRoles.forEach((ur) => {
    roles.add(ur.role.name);
    ur.role.rolePermissions.forEach((rp) => {
      permissions.add(rp.permission.code);
    });
  });

  const accessTokenLife = (process.env.JWT_ACCESS_EXPIRE ||
    '15m') as StringValue;

  const newAccessToken = jwt.sign(
    {
      id: String(session.user.id),
      email: session.user.email,
      roles: Array.from(roles),
      permissions: Array.from(permissions),
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: accessTokenLife }
  );

  return {
    accessToken: newAccessToken,
    expiresIn: accessTokenLife,
    user: {
      id: String(session.user.id),
      email: session.user.email,
      roles: Array.from(roles),
    },
  };
}

async function registerService(data: registerDto) {
  const existingUser = await findUserByContact(data.phone);

  if (existingUser) {
    throw new Error('Phone number is already in use');
  }

  const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  const user = await createUser({
    firstName: data.firstName,
    email: data.email || '',
    phone: data.phone,
    passwordHash: hashedPassword,
  });

  const role = await getRoleIdByRole({ role: 'Customer' });

  await assignRole({
    userId: user.id,
    roleId: role?.id || BigInt(1),
    status: 'ASSIGNED',
  });

  return {
    message: 'User created successfully',
  };
}

async function registerAdminService(data: any) {
  let user = await findUserByIdentifier(data.email);
  if (!user) {
    user = await findUserByIdentifier(data.phone);
  }

  const isExistingUser = !!user;

  if (isExistingUser) {
    const role = await getRoleIdByRole({ role: 'Admin' });
    if (user && role) {
      await assignRole({
        userId: user.id,
        roleId: role.id,
        status: 'REQUESTED',
      });
    }
  } else {
    const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = await createUser({
      firstName: data.firstName,
      // lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
    });

    const role = await getRoleIdByRole({ role: 'Admin' });

    if (user && role) {
      await assignRole({
        userId: user.id,
        roleId: role.id,
        status: 'REQUESTED',
      });
    }
  }

  return {
    message: isExistingUser
      ? 'Account found. Your request for admin privileges has been sent to existing administrators for review.'
      : 'Account created. Your request for admin privileges has been sent to existing administrators for review.',
  };
}

async function registerFleetManagerService(data: any) {
  let user = await findUserByIdentifier(data.email);
  if (!user) {
    user = await findUserByIdentifier(data.phone);
  }

  const isExistingUser = !!user;

  if (isExistingUser) {
    const role = await getRoleIdByRole({ role: 'Fleet_manager' });
    if (user && role) {
      await assignRole({
        userId: user.id,
        roleId: role.id,
        status: 'REQUESTED',
      });
    }
  } else {
    const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = await createUser({
      firstName: data.firstName,
      // lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
    });

    const role = await getRoleIdByRole({ role: 'Fleet_manager' });

    if (user && role) {
      await assignRole({
        userId: user.id,
        roleId: role.id,
        status: 'REQUESTED',
      });
    }
  }

  return {
    message: isExistingUser
      ? 'Account found. Your request for Fleet manager privileges has been sent to administrators for review.'
      : 'Account created. Your request for Fleet manager privileges has been sent to administrators for review.',
  };
}

async function registerDeliveryPartnerService(data: any) {
  let user = await findUserByIdentifier(data.email);
  if (!user) {
    user = await findUserByIdentifier(data.phone);
  }

  const isExistingUser = !!user;

  if (isExistingUser) {
    if (user) {
      await createDeliveryPartner({
        userId: user.id,
        vehicleType: data.vehicleType,
        vehicleRegistrationNumber: data.vehicleRegistrationNumber,
      });
    }

    const role = await getRoleIdByRole({ role: 'Delivery_partner' });

    if (user && role) {
      await assignRole({
        userId: user.id,
        roleId: role.id,
        status: 'REQUESTED',
      });
    }
  } else {
    const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = await createUser({
      firstName: data.firstName,
      // lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
    });

    await createDeliveryPartner({
      userId: user.id,
      vehicleType: data.vehicleType,
      vehicleRegistrationNumber: data.vehicleRegistrationNumber,
    });

    const role = await getRoleIdByRole({ role: 'Delivery_partner' });

    if (user && role) {
      await assignRole({
        userId: user.id,
        roleId: role.id,
        status: 'REQUESTED',
      });
    }
  }

  return {
    message: isExistingUser
      ? 'Account found. Your request for delivery partner privileges has been sent to administrators for review.'
      : 'Account created. Your request for delivery partner privileges has been sent to administrators for review.',
  };
}

async function registerRestaurantOwnerService(data: any) {
  let user = await findUserByIdentifier(data.email);
  if (!user) {
    user = await findUserByIdentifier(data.phone);
  }

  const isExistingUser = !!user;

  if (!isExistingUser) {
    const saltRounds = Number(process.env.PASSWORD_HASH_SALT || 10);
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    user = await createUser({
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
    });
  }

  await createRestaurantOwner({
    userId: user.id,
  });

  const role = await getRoleIdByRole({ role: 'Restaurant_owner' });
  if (role) {
    await assignRole({
      userId: user.id,
      roleId: role.id,
      status: 'REQUESTED',
    });
  }

  return {
    message: isExistingUser
      ? 'Account found. Your request for Restaurant owner has been sent to administrators for review.'
      : 'Account created. Your request for Restaurant owner has been sent to administrators for review.',
  };
}

export {
  forgotPasswordService,
  loginService,
  registerService,
  resetPasswordService,
  registerAdminService,
  registerFleetManagerService,
  sendOtpService,
  verifyOtpService,
  registerDeliveryPartnerService,
  refreshTokenService,
  registerRestaurantOwnerService
};
