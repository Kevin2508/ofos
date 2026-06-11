import { ErrorRequestHandler } from "express";

const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status =  err ;

  res.status(err.statusCode).json({
    status: err.status,
    message: err,
  });
};

export { errorMiddleware };
