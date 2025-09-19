import { BaseRepository } from '../../core/base.repository';
import { Prisma } from '@prisma/client';

export class CalendarRepository extends BaseRepository {
  async disconnectUser(userId: string): Promise<void> {
    await this.executeQuery(
      'update',
      'user',
      () =>
        this.prisma.user.update({
          where: { id: userId },
          data: {
            googleOauthTokens: Prisma.JsonNull,
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

  async clearUserEvents(userId: string): Promise<void> {
    await this.executeQuery(
      'deleteMany',
      'event',
      () =>
        this.prisma.event.deleteMany({
          where: { userId },
        }),
      { userId }
    );
  }
}

export const calendarRepository = new CalendarRepository();
