import { SettingsRepository } from './settings.repository';
import { BaseService } from '../../core/base.service';
import {
  UserSettings,
  UnavailabilityBlock,
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
} from '@ht-cal-01/shared-types';

export class SettingsService extends BaseService {
  private settingsRepository: SettingsRepository;

  constructor(settingsRepository: SettingsRepository) {
    super();
    this.settingsRepository = settingsRepository;
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    let settings = await this.settingsRepository.getUserSettings(userId);

    if (!settings) {
      // Create default settings if none exist
      settings = await this.settingsRepository.createUserSettings(userId, {
        timezone: 'UTC',
        availableDurations: [15, 30, 60],
        acceptsNewMeetings: true,
      });
    }

    return settings;
  }

  async updateUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettings> {
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
  }

  async deleteUserSettings(userId: string): Promise<void> {
    await this.settingsRepository.deleteUserSettings(userId);
  }

  // Unavailability Blocks methods
  async createUnavailabilityBlock(
    userId: string,
    data: CreateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    this.validateUnavailabilityBlock(data);
    return await this.settingsRepository.createUnavailabilityBlock(
      userId,
      data
    );
  }

  async updateUnavailabilityBlock(
    blockId: string,
    userId: string,
    data: UpdateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    if (data.startTime || data.endTime || data.days) {
      // Validate the complete block data
      const existingBlock =
        await this.settingsRepository.getUserUnavailabilityBlocks(userId);
      const block = existingBlock.find(b => b.id === blockId);

      if (!block) {
        throw new Error('Unavailability block not found');
      }

      const completeData = {
        title: data.title ?? block.title,
        startTime: data.startTime ?? block.startTime,
        endTime: data.endTime ?? block.endTime,
        days: data.days ?? block.days,
      };

      this.validateUnavailabilityBlock(completeData);
    }

    return await this.settingsRepository.updateUnavailabilityBlock(
      blockId,
      userId,
      data
    );
  }

  async deleteUnavailabilityBlock(
    blockId: string,
    userId: string
  ): Promise<void> {
    await this.settingsRepository.deleteUnavailabilityBlock(blockId, userId);
  }

  async getUserUnavailabilityBlocks(
    userId: string
  ): Promise<UnavailabilityBlock[]> {
    return await this.settingsRepository.getUserUnavailabilityBlocks(userId);
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
        throw new Error(`Invalid day: ${day}`);
      }

      if (hours && typeof hours === 'object') {
        const { start, end } = hours as any;

        if (!start || !end) {
          throw new Error(`Missing start or end time for ${day}`);
        }

        if (!this.isValidTimeFormat(start) || !this.isValidTimeFormat(end)) {
          throw new Error(`Invalid time format for ${day}. Use HH:MM format.`);
        }

        if (start >= end) {
          throw new Error(`Start time must be before end time for ${day}`);
        }
      }
    }
  }

  private validateAvailableDurations(durations: number[]): void {
    const validDurations = [15, 30, 45, 60, 90, 120];

    if (!Array.isArray(durations) || durations.length === 0) {
      throw new Error('Available durations must be a non-empty array');
    }

    for (const duration of durations) {
      if (!validDurations.includes(duration)) {
        throw new Error(
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
      throw new Error('Title is required');
    }

    if (!data.startTime || !data.endTime) {
      throw new Error('Start time and end time are required');
    }

    if (
      !this.isValidTimeFormat(data.startTime) ||
      !this.isValidTimeFormat(data.endTime)
    ) {
      throw new Error('Invalid time format. Use HH:MM format.');
    }

    if (data.startTime >= data.endTime) {
      throw new Error('Start time must be before end time');
    }

    if (!Array.isArray(data.days) || data.days.length === 0) {
      throw new Error('At least one day must be selected');
    }

    for (const day of data.days) {
      if (!validDays.includes(day)) {
        throw new Error(`Invalid day: ${day}`);
      }
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
