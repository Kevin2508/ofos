import crypto from 'crypto';
import ms from 'ms';
import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
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
  registerService,
  resetPasswordService,
  sendOtpService,
  verifyOtpService,
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
    const result = await registerService(req.body);

    return res.status(201).json({
      status: 'success',
      message: result.message,
    });
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

const registerFleetManager = catchAsync(async (req: Request, res: Response) => {
  const data = await registerFleetManagerService(req.body);

  res.status(200).json({
    status: 'success',
    message: data.message,
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
};
