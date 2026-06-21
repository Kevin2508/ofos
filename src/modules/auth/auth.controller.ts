import crypto from 'crypto';
import ms from 'ms';
import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import { prisma } from '../../config/prisma.ts';
import {
  forgotPasswordDto,
  loginDto,
  registerDto,
  resetPasswordDto,
  resetPasswordParamsDto,
  sendOtpDto,
  verigyOtpDto,
} from './auth.dto.ts';
import { revokeSessionByTokenHash } from './auth.repository.ts';
import {
  forgotPasswordService,
  loginService,
  refreshTokenService,
  registerAdminService,
  registerDeliveryPartnerService,
  registerFleetManagerService,
  registerFinanceManagerService,
  registerRestaurantOwnerService,
  registerRestaurantStaffService,
  registerService,
  resetPasswordService,
  sendOtpService,
  verifyOtpService,
  checkPhoneService,
  checkEmailService,
  selectRoleService,
} from './auth.service.ts';

const login = catchAsync(
  async (req: Request<{}, {}, loginDto>, res: Response) => {
    const reqMeta: { ipAddress: string; userAgent: string } = {
      ipAddress: req.ip || (req.socket.remoteAddress as string),
      userAgent: req.headers['user-agent'] as string,
    };

    const data = await loginService(req.body, reqMeta);

    const isRememberMe = req.body.rememberMe === 'True';
    const cookieLifeDays = isRememberMe
      ? Number(process.env.COOKIE_EXPIRE_REMEMBER_ME || 30)
      : Number(process.env.COOKIE_EXPIRE || 1);

    const cookieLifeMs = cookieLifeDays * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', data.tokens.refreshToken, {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieLifeMs,
      path: '/',
    });

    const accessTokenLifeMs = ms(data.tokens.expiresIn);                                             

    res.cookie('accessToken', data.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenLifeMs,
      path: '/',
    });

    res.status(200).json({
      status: 'success',
      message: data.message,
      data: {
        user: data.user,
        token: data.tokens.accessToken,
      },
    });
  }
);

const sendOtp = catchAsync(
  async (req: Request<{}, {}, sendOtpDto>, res: Response) => {
    const data = await sendOtpService(req.body);

    res
      .status(200)
      .json({ status: 'success', message: data.message, otp: data.otp });
  }
);

const verigyOtp = catchAsync(
  async (req: Request<{}, {}, verigyOtpDto>, res: Response) => {
    const data = await verifyOtpService(req.body);

    res.status(200).json({ status: 'success', message: data.message });
  }
);

const forgotPassword = catchAsync(
  async (req: Request<{}, {}, forgotPasswordDto>, res: Response) => {
    const data = await forgotPasswordService(req.body);

    res.status(200).json({
      status: 'success',
      message: data.message,
      link: data.link,
      otp: data.otp,
    });
  }
);

const resetPassword = catchAsync(
  async (
    req: Request<resetPasswordParamsDto, {}, resetPasswordDto>,
    res: Response
  ) => {
    const data = await resetPasswordService(req.body, req.params);

    res.status(200).json({ status: 'success', message: data.message });
  }
);

const logout = catchAsync(async (req: Request, res: Response) => {
  const rawRefreshToken = req.signedCookies.refreshToken;

  if (rawRefreshToken) {
    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    await revokeSessionByTokenHash(hashedRefreshToken);
  }

  res.clearCookie('refreshToken', {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

const refresh = catchAsync(async (req: Request, res: Response) => {
  const rawRefreshToken = req.signedCookies.refreshToken;

  if (!rawRefreshToken) {
    return res.status(401).json({
      status: 'fail',
      message: 'Session expired. Please log in again.',
    });
  }

  try {
    const data = await refreshTokenService(rawRefreshToken);

    const accessTokenLifeMs = ms(data.expiresIn);
    res.cookie('accessToken', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenLifeMs,
      path: '/',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
        user: data.user,
      },
    });
  } catch (error) {
    // If the database rejects the token (revoked, expired, or user we must clear the bad cookie from the browser so it stops trying to use it.
    res.clearCookie('refreshToken', {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
    });

    return res.status(401).json({
      status: 'fail',
      message: 'Invalid session. Please log in again.',
    });
  }
});

const register = catchAsync(
  async (req: Request<{}, {}, registerDto>, res: Response) => {
    const reqMeta: { ipAddress: string; userAgent: string } = {
      ipAddress: req.ip || (req.socket.remoteAddress as string),
      userAgent: req.headers['user-agent'] as string,
    };

    const data = await registerService(req.body, reqMeta);

    const cookieLifeDays = Number(process.env.COOKIE_EXPIRE || 1);
    const cookieLifeMs = cookieLifeDays * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', data.tokens.refreshToken, {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieLifeMs,
      path: '/',
    });

    const accessTokenLifeMs = ms(data.tokens.expiresIn);                                             

    res.cookie('accessToken', data.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenLifeMs,
      path: '/',
    });

    return res.status(201).json({
      status: 'success',
      message: data.message,
      data: {
        user: data.user,
        token: data.tokens.accessToken,
      },
    });
  }
);

const checkPhone = catchAsync(
  async (req: Request, res: Response) => {
    const result = await checkPhoneService(req.body);
    res.status(200).json({ status: 'success', message: result.message });
  }
);

const checkEmail = catchAsync(
  async (req: Request, res: Response) => {
    const result = await checkEmailService(req.body);
    res.status(200).json({ status: 'success', message: result.message });
  }
);

const registerAdmin = catchAsync(async (req: Request, res: Response) => {
  const data = await registerAdminService(req.body);

  res.status(200).json({
    status: 'success',
    message: data.message,
  });
});

const registerDeliveryPartner = catchAsync(
  async (req: Request, res: Response) => {
    const data = await registerDeliveryPartnerService(req.body);

    res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

const registerRestaurantOwner = catchAsync(
  async (req: Request, res: Response) => {
    const data = await registerRestaurantOwnerService(req.body, req.files);

    res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

const registerRestaurantStaff = catchAsync(
  async (req: Request, res: Response) => {
    const data = await registerRestaurantStaffService(req.body);

    res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

const registerFinanceManager = catchAsync(
  async (req: Request, res: Response) => {
    const data = await registerFinanceManagerService(req.body);

    res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);


const registerFleetManager = catchAsync(async (req: Request, res: Response) => {
  const data = await registerFleetManagerService(req.body);

  res.status(200).json({
    status: 'success',
    message: data.message,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(req.user.id) },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ status: 'fail', message: 'User not found' });
  }

  const roles: string[] = [];
  const pendingRoles: string[] = [];

  user.userRoles.forEach(ur => {
    if (ur.status === 'ASSIGNED') {
      roles.push(ur.role.name);
    } else if (ur.status === 'REQUESTED') {
      pendingRoles.push(ur.role.name);
    }
  });

  return res.status(200).json({
    status: 'success',
    data: {
      user: {
        ...req.user,
        roles,
        pendingRoles,
      },
    },
  });
});

const selectRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ status: 'fail', message: 'Role is required' });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
  }

  const result = await selectRoleService(String(req.user.id), role);

  // Set activeRole cookie
  res.cookie('activeRole', result.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });

  return res.status(200).json({
    status: 'success',
    message: 'Role selected successfully',
    data: { role: result.role },
  });
});

export {
  forgotPassword,
  login,
  registerAdmin,
  logout,
  registerDeliveryPartner,
  register,
  resetPassword,
  sendOtp,
  registerFleetManager,
  verigyOtp,
  refresh,
  registerRestaurantOwner,
  registerRestaurantStaff,
  registerFinanceManager,
  checkPhone,
  checkEmail,
  getMe,
  selectRole
};
