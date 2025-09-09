import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import {
  FirebaseAuthDto,
  RefreshTokenDto,
  ApiResponse,
  AuthResponseDto,
  User,
} from '@ht-cal-01/shared-types';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  async loginWithFirebase(req: Request, res: Response): Promise<void> {
    try {
      const { firebaseToken }: FirebaseAuthDto = req.body;

      if (!firebaseToken) {
        const response: ApiResponse = {
          success: false,
          error: 'Firebase token is required',
        };
        res.status(400).json(response);
        return;
      }

      const authResult = await this.authService.authenticateWithFirebase({
        firebaseToken,
      });

      const response: ApiResponse<AuthResponseDto> = {
        success: true,
        data: authResult,
        message: 'Authentication successful',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error);

      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };

      res.status(401).json(response);
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDto = req.body;

      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          error: 'Refresh token is required',
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      const response: ApiResponse<{ accessToken: string }> = {
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Token refresh error:', error);

      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };

      res.status(401).json(response);
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          error: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
      }

      const user = await this.userService.getUserById(req.user.userId);

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: 'User retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Get current user error:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Failed to get user information',
      };

      res.status(500).json(response);
    }
  }

  /**
   * todo: invalidate tokens
   * @param req
   * @param res
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Logout error:', error);

      const response: ApiResponse = {
        success: false,
        error: 'Logout failed',
      };

      res.status(500).json(response);
    }
  }
}
