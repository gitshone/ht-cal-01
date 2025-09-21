import { BaseService } from '../../core/base.service';
import { AuthRepository } from './auth.repository';
import { TokenBlacklistRepository } from './token-blacklist.repository';
import { EventsRepository } from '../events/events.repository';
import { User } from '@ht-cal-01/shared-types';
import {
  InvalidInputError,
  UserNotFoundError,
  FirebaseAuthFailedError,
  ConflictError,
} from '../../core/errors/http.errors';
import { auth } from '../../core/lib/firebase';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';

export class AuthService extends BaseService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private readonly JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

  constructor(
    private authRepository: AuthRepository,
    private tokenBlacklistRepository: TokenBlacklistRepository,
    private eventsRepository: EventsRepository
  ) {
    super();
  }

  async loginWithFirebase(
    firebaseToken: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    try {
      // Verify Firebase token
      const decodedToken = await auth.verifyIdToken(firebaseToken);

      if (!decodedToken.email) {
        throw new FirebaseAuthFailedError(
          'Invalid Firebase token: missing email'
        );
      }

      let user = await this.authRepository.findByEmail(decodedToken.email);

      if (!user) {
        // Generate unique handle for new user
        const generatedHandle = await this.authRepository.generateUniqueHandle(
          decodedToken.email
        );

        this.logInfo('Generated unique handle for new user', {
          email: decodedToken.email,
          generatedHandle,
        });

        user = await this.authRepository.create({
          email: decodedToken.email,
          firstName: decodedToken.name?.split(' ')[0] || 'User',
          lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
          handle: generatedHandle,
        });
      }

      if (!user) {
        throw new UserNotFoundError('Failed to create or update user');
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      this.logInfo('User authenticated with Firebase successfully', {
        userId: user.id,
        email: user.email,
      });

      return { user, accessToken, refreshToken };
    } catch (error) {
      this.handleServiceError(error as Error, 'loginWithFirebase');
    }
  }

  async getCurrentUser(userId: string): Promise<User & { hasEvents: boolean }> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      // Check if user has any events in the next 30 days
      const hasEvents = await this.checkUserHasEvents(userId);

      this.logInfo('Current user retrieved', { userId, hasEvents });
      return { ...user, hasEvents };
    } catch (error) {
      this.handleServiceError(error as Error, 'getCurrentUser', { userId });
    }
  }

  private async checkUserHasEvents(userId: string): Promise<boolean> {
    try {
      const now = dayjs().startOf('day');
      const thirtyDaysFromNow = now.add(30, 'days').endOf('day');

      const eventCount = await this.eventsRepository.countEventsInRange(
        userId,
        now.toDate(),
        thirtyDaysFromNow.toDate()
      );

      return eventCount > 0;
    } catch (error) {
      this.logError('Error checking user events', error as Error, { userId });
      return false; // Default to false if there's an error
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as {
        userId: string;
        type: string;
      };
      const user = await this.authRepository.findById(decoded.userId);

      if (!user) {
        throw new InvalidInputError('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      this.logInfo('Token refreshed successfully', { userId: user.id });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      this.handleServiceError(error as Error, 'refreshToken');
    }
  }

  async updateGoogleTokens(userId: string, tokens: any): Promise<void> {
    try {
      await this.authRepository.updateGoogleTokens(userId, tokens);
      this.logInfo('Google tokens updated', { userId });
    } catch (error) {
      this.handleServiceError(error as Error, 'updateGoogleTokens', { userId });
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await this.authRepository.findById(userId);
      return user;
    } catch (error) {
      this.handleServiceError(error as Error, 'getUserById', { userId });
    }
  }

  verifyAccessToken(token: string): {
    userId: string;
    email: string;
    type: string;
  } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as {
        userId: string;
        email: string;
        type: string;
      };
      return {
        userId: decoded.userId,
        email: decoded.email,
        type: decoded.type,
      };
    } catch {
      throw new InvalidInputError('Invalid or expired token');
    }
  }

  async blacklistToken(
    token: string,
    userId: string,
    type: 'access' | 'refresh'
  ): Promise<void> {
    try {
      const decoded = jwt.decode(token) as { exp: number };
      const expiresAt = new Date(decoded.exp * 1000);

      await this.tokenBlacklistRepository.addToken({
        token,
        userId,
        type,
        expiresAt,
      });

      this.logInfo('Token blacklisted successfully', { userId, type });
    } catch (error) {
      this.handleServiceError(error as Error, 'blacklistToken', {
        userId,
        type,
      });
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      return await this.tokenBlacklistRepository.isTokenBlacklisted(token);
    } catch (error) {
      this.handleServiceError(error as Error, 'isTokenBlacklisted');
    }
  }

  async logout(
    userId: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    try {
      if (accessToken) {
        await this.blacklistToken(accessToken, userId, 'access');
      }
      if (refreshToken) {
        await this.blacklistToken(refreshToken, userId, 'refresh');
      }

      this.logInfo('User logged out successfully', { userId });
    } catch (error) {
      this.handleServiceError(error as Error, 'logout', { userId });
    }
  }

  async updateHandle(userId: string, handle: string): Promise<User> {
    try {
      // Check if handle is already taken
      const existingUser = await this.authRepository.findByHandle(handle);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError('Handle is already taken');
      }

      // Get current user to check handle update frequency
      const currentUser = await this.authRepository.findById(userId);
      if (!currentUser) {
        throw new UserNotFoundError('User not found');
      }

      // Check if handle was updated within the last month
      if (currentUser.handleUpdatedAt) {
        const lastUpdate = dayjs(currentUser.handleUpdatedAt);
        const oneMonthAgo = dayjs().subtract(1, 'month');

        if (lastUpdate.isAfter(oneMonthAgo)) {
          const daysLeft = lastUpdate.add(1, 'month').diff(dayjs(), 'day');
          throw new InvalidInputError(
            `Handle can only be changed once per month. You can change it again in ${daysLeft} days.`
          );
        }
      }

      const updatedUser = await this.authRepository.updateHandle(
        userId,
        handle
      );

      this.logInfo('User handle updated successfully', {
        userId,
        handle,
        previousHandle: currentUser.handle,
      });

      return updatedUser;
    } catch (error) {
      this.handleServiceError(error as Error, 'updateHandle', {
        userId,
        handle,
      });
    }
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'access',
      },
      this.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      this.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }
}
