import { Request, Response, NextFunction } from "express";

const catchAsync = (func: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res, next).catch(next));
  };
};

export { catchAsync };
