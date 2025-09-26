import { apiClient } from './client';
import {
  UserSettings,
  UpdateUserSettingsDto,
  UnavailabilityBlock,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
} from '@ht-cal-01/shared-types';
import { logoService } from './logo.service';

export const settingsService = {
  async getUserSettings(): Promise<UserSettings> {
    return apiClient.get<UserSettings>('/api/settings');
  },

  async updateUserSettings(data: UpdateUserSettingsDto): Promise<UserSettings> {
    return apiClient.put<UserSettings>('/api/settings', data);
  },

  async deleteUserSettings(): Promise<void> {
    await apiClient.delete('/api/settings');
  },

  // Unavailability Blocks
  async getUnavailabilityBlocks(): Promise<UnavailabilityBlock[]> {
    return apiClient.get<UnavailabilityBlock[]>(
      '/api/settings/unavailability-blocks'
    );
  },

  async createUnavailabilityBlock(
    data: CreateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    return apiClient.post<UnavailabilityBlock>(
      '/api/settings/unavailability-blocks',
      data
    );
  },

  async updateUnavailabilityBlock(
    id: string,
    data: UpdateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    return apiClient.put<UnavailabilityBlock>(
      `/api/settings/unavailability-blocks/${id}`,
      data
    );
  },

  async deleteUnavailabilityBlock(id: string): Promise<void> {
    await apiClient.delete(`/api/settings/unavailability-blocks/${id}`);
  },

  // Logo operations
  async uploadLogo(file: File): Promise<UserSettings> {
    const response = await logoService.uploadLogo(file);
    return response.data;
  },

  async deleteLogo(): Promise<UserSettings> {
    const response = await logoService.deleteLogo();
    return response.data;
  },
};
