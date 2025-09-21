import { NextFunction, Request, Response } from 'express';
import { Exception } from '@tsed/exceptions';
import logger from '../utils/winston-logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error caught by global handler:', error);

  // Handle TsED exceptions
  if (error instanceof Exception) {
    res.status(error.status).json(error.body);
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    errorCode: 'UNKNOWN_ERROR',
  });
};
