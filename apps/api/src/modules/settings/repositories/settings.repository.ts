import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { UserSettings } from '@prisma/client';
import {
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
  UserSettingsResponseDto,
  UnavailabilityBlockResponseDto,
} from '../dtos/settings.dto';

@Injectable()
export class SettingsRepository extends BaseRepository<
  UserSettings,
  UpdateUserSettingsDto,
  UpdateUserSettingsDto
> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.userSettings;
  }

  async getUserSettings(
    userId: string
  ): Promise<UserSettingsResponseDto | null> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    return settings as UserSettingsResponseDto | null;
  }

  async createUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettingsResponseDto> {
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

    return settings as UserSettingsResponseDto;
  }

  async updateUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettingsResponseDto> {
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

    return settings as UserSettingsResponseDto;
  }

  async deleteUserSettings(userId: string): Promise<void> {
    await this.prisma.userSettings.delete({
      where: { userId },
    });
  }

  // Unavailability Blocks methods
  async createUnavailabilityBlock(
    userId: string,
    data: CreateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlockResponseDto> {
    const block = await this.prisma.unavailabilityBlock.create({
      data: {
        userId,
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        days: data.days,
      },
    });

    return block as UnavailabilityBlockResponseDto;
  }

  async updateUnavailabilityBlock(
    blockId: string,
    userId: string,
    data: UpdateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlockResponseDto> {
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

    return block as UnavailabilityBlockResponseDto;
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
  ): Promise<UnavailabilityBlockResponseDto[]> {
    const blocks = await this.prisma.unavailabilityBlock.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return blocks as UnavailabilityBlockResponseDto[];
  }

  async getUnavailabilityBlockById(
    blockId: string,
    userId: string
  ): Promise<UnavailabilityBlockResponseDto | null> {
    const block = await this.prisma.unavailabilityBlock.findFirst({
      where: {
        id: blockId,
        userId,
      },
    });

    return block as UnavailabilityBlockResponseDto | null;
  }
}
