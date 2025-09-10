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

    const decoded = authService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token',
    };
    res.status(401).json(response);
  }
};
