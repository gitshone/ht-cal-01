import { BaseRepository } from '../../core/base.repository';

export class GoogleOAuthRepository extends BaseRepository {
  async updateTokens(
    userId: string,
    tokens: {
      access_token: string;
      refresh_token: string;
      expiry_date: number;
      scope: string;
    }
  ): Promise<void> {
    await this.executeQuery(
      'update',
      'user',
      () =>
        this.prisma.user.update({
          where: { id: userId },
          data: {
            googleOauthTokens: tokens,
          },
        }),
      { userId }
    );
  }

  async getUserTokens(
    userId: string
  ): Promise<{ googleOauthTokens: any } | null> {
    return this.executeQuery(
      'findUnique',
      'user',
      () =>
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { googleOauthTokens: true },
        }),
      { userId }
    );
  }

  async revokeTokens(userId: string): Promise<void> {
    await this.executeQuery(
      'update',
      'user',
      () =>
        this.prisma.user.update({
          where: { id: userId },
          data: {
            googleOauthTokens: undefined,
          },
        }),
      { userId }
    );
  }
}
