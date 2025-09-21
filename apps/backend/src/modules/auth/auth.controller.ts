import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller';
import { AuthService } from './auth.service';
import { AuthValidator } from './auth.validator';

export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }
  async loginWithFirebase(req: Request, res: Response) {
    const validator = new AuthValidator();
    const validatedData = validator.validateFirebaseAuth(req.body);
    const result = await this.authService.loginWithFirebase(
      validatedData.firebaseToken
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });

    this.sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Authentication successful'
    );
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      this.sendError(res, 'Refresh token required', 401);
      return;
    }

    const result = await this.authService.refreshToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });

    this.sendSuccess(
      res,
      {
        accessToken: result.accessToken,
      },
      'Token refreshed successfully'
    );
  }

  async getCurrentUser(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const user = await this.authService.getCurrentUser(userId);

    this.sendSuccess(res, user, 'Current user retrieved');
  }

  async logout(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;
    const refreshToken = req.cookies.refreshToken;

    await this.authService.logout(userId, accessToken, refreshToken);

    res.clearCookie('refreshToken', {
      path: '/api/auth',
    });

    this.sendSuccess(res, null, 'Logout successful');
  }

  async updateHandle(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const validator = new AuthValidator();
    const validatedData = validator.validateUpdateHandle(req.body);

    const updatedUser = await this.authService.updateHandle(
      userId,
      validatedData.handle
    );

    this.sendSuccess(res, updatedUser, 'Handle updated successfully');
  }
}
