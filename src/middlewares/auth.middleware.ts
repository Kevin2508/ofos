import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.ts';

import { refreshTokenService } from '../modules/auth/auth.service.ts';
import ms from 'ms';

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  const secret = process.env.JWT_ACCESS_SECRET as string;

  if (!secret) {
    throw new Error('Server configuration error: JWT_ACCESS_SECRET is missing.');
  }

  // Helper to handle silent token refresh
  const handleSilentRefresh = async () => {
    const rawRefreshToken = req.signedCookies.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).render('default/notAuthenticated');
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

      req.user = data.user as any;
      return next();
    } catch (refreshErr) {
      res.clearCookie('refreshToken', { signed: true, httpOnly: true, path: '/' });
      res.clearCookie('accessToken', { httpOnly: true, path: '/' });
      return res.status(401).render('default/notAuthenticated');
    }
  };

  if (!token) {
    // Attempt to silently refresh if access token is missing but refresh token might exist
    return await handleSilentRefresh();
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded as any;
    return next();
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        // Access token expired, attempt silent refresh
        return await handleSilentRefresh();
      }
    }
    return res.status(401).render('default/notAuthenticated');
  }
};

const authorize = (requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.render('default/notAuthenticated');
    }

    const activeRole = req.cookies.activeRole;

    // Check if active role is one of the allowed roles
    if (!activeRole || !requiredRoles.includes(activeRole)) {
      return res.render('default/notAuthorize');
    }

    // Verify against DB
    const userRoleRecord = await prisma.userRole.findFirst({
      where: {
        userId: BigInt(req.user.id),
        role: {
          name: {
            in: requiredRoles
          }
        }
      },
      include: {
        role: true
      }
    });

    if (!userRoleRecord) {
      return res.render('default/notAuthorize');
    }

    if (userRoleRecord.status === 'REQUESTED') {
      return res.redirect('/default/pendingVerification');
    }

    if (userRoleRecord.status !== 'ASSIGNED') {
      return res.render('default/notAuthorize');
    }

    next();
  };
};

export { authenticate, authorize };
