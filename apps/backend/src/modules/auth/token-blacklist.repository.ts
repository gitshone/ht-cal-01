import { BaseRepository } from '../../core/base.repository';

export interface TokenBlacklistData {
  token: string;
  userId: string;
  type: 'access' | 'refresh';
  expiresAt: Date;
}

export class TokenBlacklistRepository extends BaseRepository {
  async addToken(data: TokenBlacklistData): Promise<void> {
    await this.executeQuery(
      'create',
      'tokenBlacklist',
      () =>
        this.prisma.tokenBlacklist.create({
          data: {
            token: data.token,
            userId: data.userId,
            type: data.type,
            expiresAt: data.expiresAt,
          },
        }),
      { userId: data.userId, type: data.type }
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.executeQuery(
      'findUnique',
      'tokenBlacklist',
      () =>
        this.prisma.tokenBlacklist.findUnique({
          where: { token },
          select: { id: true },
        }),
      { token }
    );

    return !!blacklistedToken;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = (await this.executeQuery(
      'deleteMany',
      'tokenBlacklist',
      () =>
        this.prisma.tokenBlacklist.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        }),
      {}
    )) as { count: number };

    this.logInfo('Cleaned up expired blacklisted tokens', {
      count: result.count,
    });
    return result.count;
  }

  async getBlacklistedTokensCount(): Promise<number> {
    const count = (await this.executeQuery(
      'count',
      'tokenBlacklist',
      () => this.prisma.tokenBlacklist.count(),
      {}
    )) as number;

    return count;
  }
}

export const tokenBlacklistRepository = new TokenBlacklistRepository();
