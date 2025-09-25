import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL') || '';
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_ACCESS_SECRET') || '';
  }

  get refreshTokenSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET') || '';
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m');
  }

  get refreshTokenExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
  }

  get firebaseProjectId(): string {
    return this.configService.get<string>('FIREBASE_PROJECT_ID') || '';
  }

  get firebasePrivateKey(): string {
    return this.configService.get<string>('FIREBASE_PRIVATE_KEY') || '';
  }

  get firebaseClientEmail(): string {
    return this.configService.get<string>('FIREBASE_CLIENT_EMAIL') || '';
  }

  get googleClientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID') || '';
  }

  get googleClientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
  }

  get googleRedirectUri(): string {
    return (
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:4200/auth/google/callback'
    );
  }

  get redisUrl(): string {
    return (
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379'
    );
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST') || 'localhost';
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT') || 6379;
  }

  get awsAccessKeyId(): string {
    return (
      this.configService.get<string>('AWS_ACCESS_KEY_ID') ||
      this.configService.get<string>('S3_ACCESS_KEY_ID') ||
      ''
    );
  }

  get awsSecretAccessKey(): string {
    return (
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') ||
      ''
    );
  }

  get awsRegion(): string {
    return (
      this.configService.get<string>('AWS_REGION') ||
      this.configService.get<string>('S3_REGION') ||
      'us-east-1'
    );
  }

  get awsS3Bucket(): string {
    return (
      this.configService.get<string>('AWS_S3_BUCKET') ||
      this.configService.get<string>('S3_BUCKET_NAME') ||
      ''
    );
  }

  get s3Endpoint(): string {
    return this.configService.get<string>('S3_ENDPOINT') || '';
  }

  get sentryDsn(): string {
    return this.configService.get<string>('SENTRY_DSN') || '';
  }

  get appVersion(): string {
    return this.configService.get<string>('APP_VERSION') || '1.0.0';
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
