import type { ErrorRequestHandler } from "express";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../errors.js";

export const middlewareErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  next,
) => {
  console.log(err);

  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = 500;
  let message = "Something went wrong on our end";

  if (err instanceof BadRequestError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  }

  res.status(statusCode).json({
    error: message,
  });
};