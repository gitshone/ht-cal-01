import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AppConfigService } from '../../../core/config/app-config.service';
import {
  FirebaseLoginDto,
  RefreshTokenDto,
  LoginResponseDto,
} from '../dtos/auth.dto';
import * as admin from 'firebase-admin';
import { SentryOperation } from '../../../core/decorators/sentry-operation.decorator';

@Injectable()
export class AuthService {
  private firebaseApp!: admin.app.App;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: AppConfigService
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.config.firebaseProjectId,
          privateKey: this.config.firebasePrivateKey.replace(/\\n/g, '\n'),
          clientEmail: this.config.firebaseClientEmail,
        }),
      });
    } else {
      const existingApp = admin.apps[0];
      if (!existingApp) {
        throw new Error('Firebase app not initialized');
      }
      this.firebaseApp = existingApp;
    }
  }

  async validateFirebaseToken(token: string): Promise<any> {
    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.error('Firebase token validation failed:', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async findOrCreateUser(firebaseUser: any) {
    const { uid, email, name } = firebaseUser;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const [firstName, ...lastNameParts] = (name || '').split(' ');
      user = await this.prisma.user.create({
        data: {
          id: uid,
          email,
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
        },
      });
    }

    return user;
  }

  @SentryOperation({
    operation: 'read',
    category: 'database',
    description: 'Getting user by ID',
    trackSuccess: false,
  })
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async generateTokens(user: any): Promise<LoginResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.jwtExpiresIn,
      secret: this.config.jwtSecret,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.refreshTokenExpiresIn,
      secret: this.config.refreshTokenSecret,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        handle: user.handle,
      },
    };
  }

  async validateJwtToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      console.error('JWT token validation failed:', error);
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  async blacklistToken(
    token: string,
    userId: string,
    type: 'access' | 'refresh'
  ) {
    const decoded = this.jwtService.decode(token) as any;
    const expiresAt = new Date(decoded.exp * 1000);

    await this.prisma.tokenBlacklist.create({
      data: {
        token,
        userId,
        type,
        expiresAt,
      },
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    return !!blacklistedToken;
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto
  ): Promise<LoginResponseDto> {
    const decoded = this.jwtService.verify(refreshTokenDto.refreshToken, {
      secret: this.config.refreshTokenSecret,
    });

    if (await this.isTokenBlacklisted(refreshTokenDto.refreshToken)) {
      throw new UnauthorizedException('Token has been blacklisted');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.blacklistToken(refreshTokenDto.refreshToken, user.id, 'refresh');

    return this.generateTokens(user);
  }

  async logout(accessToken: string, refreshToken?: string) {
    const decoded = this.jwtService.decode(accessToken) as any;
    const userId = decoded.sub;

    await this.blacklistToken(accessToken, userId, 'access');

    if (refreshToken) {
      await this.blacklistToken(refreshToken, userId, 'refresh');
    }
  }

  async firebaseLogin(loginDto: FirebaseLoginDto): Promise<LoginResponseDto> {
    const firebaseUser = await this.validateFirebaseToken(loginDto.idToken);
    const user = await this.findOrCreateUser(firebaseUser);
    return this.generateTokens(user);
  }

  async updateHandle(userId: string, handle: string): Promise<void> {
    // Validate handle format
    const handleRegex = /^[a-zA-Z0-9_-]+$/;
    if (!handleRegex.test(handle) || handle.length < 3 || handle.length > 30) {
      throw new Error(
        'Handle must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'
      );
    }

    // Check if handle already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { handle },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Handle already exists');
    }

    // Update user handle
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        handle,
        handleUpdatedAt: new Date(),
      },
    });
  }
}
