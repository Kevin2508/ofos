import { Request, Response, NextFunction } from "express";
import { updateTimeZone } from "../modules/user/user.repository.ts";

const handleTimeZone = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const deviceTz = req.headers["x-timezone"] as string;
  const userTz = req.user?.timeZone;

  req.timezone = deviceTz || userTz || "UTC";

  if (deviceTz && userTz && deviceTz !== userTz) {
    await updateTimeZone(Number(req.user?.id), deviceTz);
  }

  next();
};

export { handleTimeZone };
