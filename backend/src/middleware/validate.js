import { AppError } from "../utils/AppError.js";

export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      const message = error.details[0].message;
      const appError = new AppError(message, 400);
      return next(appError);
    }
    req.body = value;
    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);
    if (error) {
      const message = error.details[0].message;
      const appError = new AppError(message, 400);
      return next(appError);
    }
    req.params = value;
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      const message = error.details[0].message;
      const appError = new AppError(message, 400);
      return next(appError);
    }
    req.query = value;
    next();
  };
};