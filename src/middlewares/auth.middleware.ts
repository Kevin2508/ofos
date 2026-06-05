import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.ts";
import jwt from "jsonwebtoken";
// import { IjwtUser } from "../modules/auth/auth.interface.ts";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.signedCookies.token;

  if (!token) res.redirect("/not-authenticated");

  try {
    const secret = env.JWT_SECRET as string;
    const result = jwt.verify(token, secret);
    req.user = result ;
    next();
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "TokenExpiredError") {
        throw new Error("Token has expired.");
      }
      if (err.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
    }
    throw new Error("Not authenticated");
  }
};

export { authenticate };
