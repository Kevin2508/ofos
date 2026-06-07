import { NextFunction, Request, Response } from 'express';
// import { env } from '../config/env.ts';
import jwt from 'jsonwebtoken';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Not authenticated. No access token provided.');
  }

  const token = authHeader.split(' ')[1];

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

    req.user = decoded;

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

export { authenticate };
