import { NextFunction, Request, Response } from 'express';
// import { env } from '../config/env.ts';
import jwt from 'jsonwebtoken';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.render('default/notAuthenticated')
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET as string;

    if (!secret) {
      throw new Error(
        'Server configuration error: JWT_ACCESS_SECRET is missing.'
      );
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded as any;
    // console.log('Authenticated user:', req.user);

    next();
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        // CRITICAL: The frontend looks for this specific error to know
        // it's time to quietly hit your /refresh-token endpoint!
        throw new Error('Access token has expired.');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token.');
      }
    }
    return res.render('default/notAuthenticated')
  }
};

const authorize = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {

    if (!req.user || !(req.user as any).roles) {
      return res.render('default/notAuthenticated')
    }

    const hasPendingRole = (req.user as any).pendingRoles?.some(
      (role: string) => role === requiredRole
    );

    if (hasPendingRole) {
      // res.status(403).json({ message: 'Verification Pending' });
      return res.redirect('default/pendingVerification');
    }

    const hasRole = (req.user as any).roles?.some(
      (role: string) => role === requiredRole
    );

    if (!hasRole) {
      return res.render('default/notAuthorize')
    }

    next();
  };
};

export { authenticate, authorize };
