import { ErrorRequestHandler } from "express";

const errorMiddleware: ErrorRequestHandler = (err: any, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    status,
    message: err.message || "Internal Server Error",
  });
};

export { errorMiddleware };