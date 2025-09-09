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
import {
  AuthenticationRequiredError,
  MissingRequiredFieldsError,
  FirebaseAuthFailedError,
  UserNotFoundError,
  InvalidTokenError,
  UnknownError,
} from '../errors/http.errors';

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
        throw new MissingRequiredFieldsError('Firebase token is required');
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
    } catch {
      throw new FirebaseAuthFailedError();
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDto = req.body;

      if (!refreshToken) {
        throw new MissingRequiredFieldsError('Refresh token is required');
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      const response: ApiResponse<{ accessToken: string }> = {
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch {
      throw new InvalidTokenError('Token refresh failed. Please log in again.');
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationRequiredError();
      }

      const user = await this.userService.getUserById(req.user.userId);

      if (!user) {
        throw new UserNotFoundError();
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: 'User retrieved successfully',
      };

      res.status(200).json(response);
    } catch {
      throw new UnknownError(
        'Failed to get user information. Please try again.'
      );
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
    } catch {
      throw new UnknownError('Logout failed. Please try again.');
    }
  }
}
