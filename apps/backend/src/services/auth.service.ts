import * as jwt from 'jsonwebtoken';
import { auth } from '../lib/firebase';
import { UserService } from './user.service';
import { User as PrismaUser } from '@prisma/client';
import {
  FirebaseAuthDto,
  AuthResponseDto,
  JwtPayload,
  FirebaseUserInfo,
  User,
} from '@ht-cal-01/shared-types';

export class AuthService {
  private userService: UserService;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.userService = new UserService();
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  async authenticateWithFirebase(
    firebaseAuthDto: FirebaseAuthDto
  ): Promise<AuthResponseDto> {
    try {
      const decodedToken = await auth.verifyIdToken(
        firebaseAuthDto.firebaseToken
      );

      const firebaseUser: FirebaseUserInfo = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        picture: decodedToken.picture,
        email_verified: decodedToken.email_verified || false,
      };

      if (!firebaseUser.email_verified) {
        throw new Error('Email not verified');
      }

      let user = await this.userService.getUserByEmail(firebaseUser.email);

      if (!user) {
        const nameParts = firebaseUser.name.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        const userWithoutPassword = await this.userService.createUser({
          email: firebaseUser.email,
          password: 'firebase-auth',
          firstName,
          lastName,
        });

        user = {
          ...userWithoutPassword,
          password: 'firebase-auth',
        } as PrismaUser;
      }

      if (!user) {
        throw new Error('User not found');
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword as User,
        accessToken,
        refreshToken,
      };
    } catch {
      throw new Error('Invalid Firebase token');
    }
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        this.refreshTokenSecret
      ) as JwtPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await this.userService.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = this.generateAccessToken({
        ...user,
        password: 'placeholder',
      } as PrismaUser);

      return { accessToken: newAccessToken };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  private generateAccessToken(user: PrismaUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      type: 'access',
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    } as jwt.SignOptions);
  }

  private generateRefreshToken(user: PrismaUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      type: 'refresh',
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JwtPayload;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch {
      throw new Error('Invalid access token');
    }
  }
}
