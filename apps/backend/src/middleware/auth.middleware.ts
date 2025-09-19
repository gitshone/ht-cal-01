import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth';
import { JwtPayload, ApiResponse } from '@ht-cal-01/shared-types';

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      const response: ApiResponse = {
        success: false,
        error: 'Token has been revoked',
      };
      res.status(401).json(response);
      return;
    }

    const decoded = authService.verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type as 'access' | 'refresh',
    };
    next();
  } catch {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token',
    };
    res.status(401).json(response);
  }
};
