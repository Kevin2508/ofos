import type { NextFunction, Request, Response } from "express";
import type { ObjectSchema } from "joi";

const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body)
      return res
        .status(400)
        .json({ status: "error", error: "Please send data!" });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details
        .map((detail) => detail.message.replace(/\"/g, ""))
        .join(", ");

      return res
        .status(400)
        .json({ status: "error", error: "validation failed!", errors });
    }
    return next();
  };
};

export { validate };
