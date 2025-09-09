import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtPayload, ApiResponse } from '@ht-cal-01/shared-types';

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

const authService = new AuthService();

/**
 * Middleware to authenticate requests using JWT tokens
 * Requires a valid Bearer token in the Authorization header
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      const response: ApiResponse = {
        success: false,
        error: 'Authorization header is required',
      };
      res.status(401).json(response);
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: 'Authorization header must start with "Bearer "',
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.substring(7);

    if (!token || token.length < 10) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid token format',
      };
      res.status(401).json(response);
      return;
    }

    const decoded = authService.verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    // Provide more specific error messages
    let errorMessage = 'Invalid or expired token';
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'Token has expired';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid token';
      }
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
    };
    res.status(401).json(response);
  }
};
