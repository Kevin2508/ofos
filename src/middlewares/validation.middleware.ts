import type { NextFunction, Request, Response } from 'express';
import type { ObjectSchema } from 'joi';

const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body)
      return res
        .status(400)
        .json({ status: 'error', error: 'Please send data!' });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details
        .map((detail) => detail.message.replace(/\"/g, ''))
        .join(', ');

      return res
        .status(400)
        .json({ status: 'error', error: 'validation failed!', errors });
    }
    return next();
  };
};

const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // if (!req.query || Object.keys(req.query).length === 0) {
    //   return res
    //     .status(400)
    //     .json({ status: 'error', error: 'Please send query parameters!' });
    // }

    const { error, value } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errors = error.details
        .map((detail) => detail.message.replace(/\"/g, ''))
        .join(', ');

      return res
        .status(400)
        .json({ status: 'error', error: 'validation failed!', errors });
    }

    // req.query = value;
    for (const key in req.query) {
      delete req.query[key];
    }
    Object.assign(req.query, value);

    return next();
  };
};

const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const errors = error.details
        .map((detail) => detail.message.replace(/\"/g, ''))
        .join(', ');

      return res
        .status(400)
        .json({ status: 'error', error: 'validation failed!', errors });
    }

    for (const key in req.params) {
      delete req.params[key];
    }
    Object.assign(req.params, value);

    return next();
  };
};

export { validate, validateQuery, validateParams };
