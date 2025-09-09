import { Request, Response } from 'express';
import { Exception } from '@tsed/exceptions';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response
): void => {
  console.error('Error caught by global handler:', error);

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
