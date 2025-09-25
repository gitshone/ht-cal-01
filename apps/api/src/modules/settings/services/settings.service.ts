import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SettingsRepository } from '../repositories/settings.repository';
import { FileStorageService } from '../../../infrastructure/file-storage/file-storage.service';
import {
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
  UserSettingsResponseDto,
  UnavailabilityBlockResponseDto,
} from '../dtos/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private settingsRepository: SettingsRepository,
    private fileStorageService: FileStorageService
  ) {}

  async getUserSettings(userId: string): Promise<UserSettingsResponseDto> {
    try {
      let settings = await this.settingsRepository.getUserSettings(userId);

      if (!settings) {
        settings = await this.settingsRepository.createUserSettings(userId, {
          availableDurations: [15, 30, 60],
          acceptsNewMeetings: true,
        });
      }

      // Generate logo URL if needed
      if (settings.inviteLogoKey && !settings.inviteLogoUrl) {
        try {
          const logoUrl = await this.fileStorageService.getSignedUrl(
            settings.inviteLogoKey
          );
          settings.inviteLogoUrl = logoUrl;
        } catch (error) {
          this.logger.error('Failed to generate logo URL', error, {
            userId,
            logoKey: settings.inviteLogoKey,
          });
        }
      }

      return settings;
    } catch (error) {
      this.logger.error('Failed to get user settings', error, { userId });
      throw error;
    }
  }

  async updateUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettingsResponseDto> {
    try {
      // Check if settings exist
      const existingSettings = await this.settingsRepository.getUserSettings(
        userId
      );

      if (!existingSettings) {
        // Create new settings if none exist
        return await this.settingsRepository.createUserSettings(userId, data);
      }

      // Validate working hours if provided
      if (data.defaultWorkingHours) {
        this.validateWorkingHours(data.defaultWorkingHours);
      }

      // Validate available durations if provided
      if (data.availableDurations) {
        this.validateAvailableDurations(data.availableDurations);
      }

      return await this.settingsRepository.updateUserSettings(userId, data);
    } catch (error) {
      this.logger.error('Failed to update user settings', error, { userId });
      throw error;
    }
  }

  async deleteUserSettings(userId: string): Promise<void> {
    try {
      await this.settingsRepository.deleteUserSettings(userId);
    } catch (error) {
      this.logger.error('Failed to delete user settings', error, { userId });
      throw error;
    }
  }

  // Unavailability Blocks methods
  async createUnavailabilityBlock(
    userId: string,
    data: CreateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlockResponseDto> {
    try {
      this.validateUnavailabilityBlock(data);
      return await this.settingsRepository.createUnavailabilityBlock(
        userId,
        data
      );
    } catch (error) {
      this.logger.error('Failed to create unavailability block', error, {
        userId,
      });
      throw error;
    }
  }

  async updateUnavailabilityBlock(
    blockId: string,
    userId: string,
    data: UpdateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlockResponseDto> {
    try {
      // Check if block exists
      const existingBlock =
        await this.settingsRepository.getUnavailabilityBlockById(
          blockId,
          userId
        );
      if (!existingBlock) {
        throw new NotFoundException('Unavailability block not found');
      }

      if (data.startTime || data.endTime || data.days) {
        // Validate the complete block data
        const completeData = {
          title: data.title ?? existingBlock.title,
          startTime: data.startTime ?? existingBlock.startTime,
          endTime: data.endTime ?? existingBlock.endTime,
          days: data.days ?? existingBlock.days,
        };

        this.validateUnavailabilityBlock(completeData);
      }

      return await this.settingsRepository.updateUnavailabilityBlock(
        blockId,
        userId,
        data
      );
    } catch (error) {
      this.logger.error('Failed to update unavailability block', error, {
        blockId,
        userId,
      });
      throw error;
    }
  }

  async deleteUnavailabilityBlock(
    blockId: string,
    userId: string
  ): Promise<void> {
    try {
      // Check if block exists
      const existingBlock =
        await this.settingsRepository.getUnavailabilityBlockById(
          blockId,
          userId
        );
      if (!existingBlock) {
        throw new NotFoundException('Unavailability block not found');
      }

      await this.settingsRepository.deleteUnavailabilityBlock(blockId, userId);
    } catch (error) {
      this.logger.error('Failed to delete unavailability block', error, {
        blockId,
        userId,
      });
      throw error;
    }
  }

  async getUserUnavailabilityBlocks(
    userId: string
  ): Promise<UnavailabilityBlockResponseDto[]> {
    try {
      return await this.settingsRepository.getUserUnavailabilityBlocks(userId);
    } catch (error) {
      this.logger.error('Failed to get user unavailability blocks', error, {
        userId,
      });
      throw error;
    }
  }

  async uploadLogo(
    userId: string,
    file: any
  ): Promise<UserSettingsResponseDto> {
    try {
      // Validate the file
      this.fileStorageService.validateImageFile(file);

      // Upload to S3
      const uploadResult = await this.fileStorageService.uploadLogo(
        userId,
        file
      );

      // Get current settings
      const currentSettings = await this.getUserSettings(userId);

      // Delete old logo if it exists
      if (currentSettings.inviteLogoKey) {
        try {
          await this.fileStorageService.deleteFile(
            currentSettings.inviteLogoKey
          );
        } catch (error) {
          this.logger.error('Failed to delete old logo', error, {
            userId,
            oldKey: currentSettings.inviteLogoKey,
          });
        }
      }

      // Update settings with new logo key and URL
      const updatedSettings = await this.settingsRepository.updateUserSettings(
        userId,
        {
          inviteLogoKey: uploadResult.key,
          inviteLogoUrl: uploadResult.url,
        }
      );

      return updatedSettings;
    } catch (error) {
      this.logger.error('Failed to upload logo', error, { userId });
      throw error;
    }
  }

  async deleteLogo(userId: string): Promise<UserSettingsResponseDto> {
    try {
      const currentSettings = await this.getUserSettings(userId);

      if (!currentSettings.inviteLogoKey) {
        throw new BadRequestException('No logo to delete');
      }

      // Delete from S3
      await this.fileStorageService.deleteFile(currentSettings.inviteLogoKey);

      // Update settings to remove logo
      const updatedSettings = await this.settingsRepository.updateUserSettings(
        userId,
        {
          inviteLogoKey: null,
          inviteLogoUrl: null,
        }
      );

      return updatedSettings;
    } catch (error) {
      this.logger.error('Failed to delete logo', error, { userId });
      throw error;
    }
  }

  // Validation methods
  private validateWorkingHours(workingHours: any): void {
    const validDays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    for (const [day, hours] of Object.entries(workingHours)) {
      if (!validDays.includes(day)) {
        throw new BadRequestException(`Invalid day: ${day}`);
      }

      if (hours && typeof hours === 'object') {
        const { start, end } = hours as any;

        if (!start || !end) {
          throw new BadRequestException(`Missing start or end time for ${day}`);
        }

        if (!this.isValidTimeFormat(start) || !this.isValidTimeFormat(end)) {
          throw new BadRequestException(
            `Invalid time format for ${day}. Use HH:MM format.`
          );
        }

        if (start >= end) {
          throw new BadRequestException(
            `Start time must be before end time for ${day}`
          );
        }
      }
    }
  }

  private validateAvailableDurations(durations: number[]): void {
    const validDurations = [15, 30, 45, 60, 90, 120];

    if (!Array.isArray(durations) || durations.length === 0) {
      throw new BadRequestException(
        'Available durations must be a non-empty array'
      );
    }

    for (const duration of durations) {
      if (!validDurations.includes(duration)) {
        throw new BadRequestException(
          `Invalid duration: ${duration}. Valid durations are: ${validDurations.join(
            ', '
          )}`
        );
      }
    }
  }

  private validateUnavailabilityBlock(
    data: CreateUnavailabilityBlockDto
  ): void {
    const validDays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestException('Title is required');
    }

    if (!data.startTime || !data.endTime) {
      throw new BadRequestException('Start time and end time are required');
    }

    if (
      !this.isValidTimeFormat(data.startTime) ||
      !this.isValidTimeFormat(data.endTime)
    ) {
      throw new BadRequestException('Invalid time format. Use HH:MM format.');
    }

    if (data.startTime >= data.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (!Array.isArray(data.days) || data.days.length === 0) {
      throw new BadRequestException('At least one day must be selected');
    }

    for (const day of data.days) {
      if (!validDays.includes(day)) {
        throw new BadRequestException(`Invalid day: ${day}`);
      }
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
