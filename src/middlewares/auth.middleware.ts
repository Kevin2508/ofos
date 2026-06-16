import { NextFunction, Request, Response } from 'express';
// import { env } from '../config/env.ts';
import jwt from 'jsonwebtoken';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
<<<<<<< HEAD
  //console.log('Access Token from Cookie:', token);
=======

<<<<<<< HEAD
>>>>>>> 5a07a3a (Refine Auth Module)
=======
  //console.log('Access Token from Cookie:', token);
>>>>>>> bdca7d7 (sadfgdg)
  if (!token) {
    throw new Error('Not authenticated. No access token provided.');
  }

  if (!token) throw new Error('Not authenticated');
  // if (!token) res.redirect('/not-authenticated');

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
    throw new Error('Not authenticated.');
  }
};

const authorize = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles) {
      res.status(401).json({ message: 'Unauthorized: No user or roles found' });
      return;
    }

    const hasPendingRole = req.user.pendingRoles.some(
      (role: string) => role === requiredRole
    );

    if (hasPendingRole) {
      // res.status(403).json({ message: 'Verification Pending' });
      res.redirect('/pendingVerificationPage');
      return;
    }

    const hasRole = req.user.roles.some(
      (role: string) => role === requiredRole
    );

    if (!hasRole) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};

export { authenticate, authorize };
