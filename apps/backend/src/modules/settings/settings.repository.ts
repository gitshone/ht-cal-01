import { BaseRepository } from '../../core/base.repository';
import {
  UserSettings,
  UnavailabilityBlock,
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
} from '@ht-cal-01/shared-types';

export class SettingsRepository extends BaseRepository {
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    return settings as UserSettings | null;
  }

  async createUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettings> {
    const settings = await this.prisma.userSettings.create({
      data: {
        userId,
        defaultWorkingHours: data.defaultWorkingHours as any,
        timezone: data.timezone || 'UTC',
        inviteTitle: data.inviteTitle || null,
        inviteDescription: data.inviteDescription || null,
        inviteLogoUrl: data.inviteLogoUrl || null,
        inviteLogoKey: data.inviteLogoKey || null,
        availableDurations: data.availableDurations || [15, 30, 60],
        acceptsNewMeetings:
          data.acceptsNewMeetings !== undefined
            ? data.acceptsNewMeetings
            : true,
      },
    });

    return settings as UserSettings;
  }

  async updateUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettings> {
    const settings = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        ...(data.defaultWorkingHours !== undefined && {
          defaultWorkingHours: data.defaultWorkingHours as any,
        }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.inviteTitle !== undefined && {
          inviteTitle: data.inviteTitle,
        }),
        ...(data.inviteDescription !== undefined && {
          inviteDescription: data.inviteDescription,
        }),
        ...(data.inviteLogoUrl !== undefined && {
          inviteLogoUrl: data.inviteLogoUrl,
        }),
        ...(data.inviteLogoKey !== undefined && {
          inviteLogoKey: data.inviteLogoKey,
        }),
        ...(data.availableDurations !== undefined && {
          availableDurations: data.availableDurations,
        }),
        ...(data.acceptsNewMeetings !== undefined && {
          acceptsNewMeetings: data.acceptsNewMeetings,
        }),
      },
    });

    return settings as UserSettings;
  }

  async deleteUserSettings(userId: string): Promise<void> {
    await this.prisma.userSettings.delete({
      where: { userId },
    });
  }

  async createUnavailabilityBlock(
    userId: string,
    data: CreateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    const block = await this.prisma.unavailabilityBlock.create({
      data: {
        userId,
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        days: data.days,
      },
    });

    return block as UnavailabilityBlock;
  }

  async updateUnavailabilityBlock(
    blockId: string,
    userId: string,
    data: UpdateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    const block = await this.prisma.unavailabilityBlock.update({
      where: {
        id: blockId,
        userId,
      },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.days !== undefined && { days: data.days }),
      },
    });

    return block as UnavailabilityBlock;
  }

  async deleteUnavailabilityBlock(
    blockId: string,
    userId: string
  ): Promise<void> {
    await this.prisma.unavailabilityBlock.delete({
      where: {
        id: blockId,
        userId,
      },
    });
  }

  async getUserUnavailabilityBlocks(
    userId: string
  ): Promise<UnavailabilityBlock[]> {
    const blocks = await this.prisma.unavailabilityBlock.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return blocks as UnavailabilityBlock[];
  }
}
