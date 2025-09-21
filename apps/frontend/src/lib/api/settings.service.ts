import { apiClient, handleApiResponse } from './client';
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
    const response = await apiClient.get('/api/settings');
    return handleApiResponse(response);
  },

  async updateUserSettings(data: UpdateUserSettingsDto): Promise<UserSettings> {
    const response = await apiClient.put('/api/settings', data);
    return handleApiResponse(response);
  },

  async deleteUserSettings(): Promise<void> {
    await apiClient.delete('/api/settings');
  },

  // Unavailability Blocks
  async getUnavailabilityBlocks(): Promise<UnavailabilityBlock[]> {
    const response = await apiClient.get('/api/settings/unavailability-blocks');
    return handleApiResponse(response);
  },

  async createUnavailabilityBlock(
    data: CreateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    const response = await apiClient.post(
      '/api/settings/unavailability-blocks',
      data
    );
    return handleApiResponse(response);
  },

  async updateUnavailabilityBlock(
    id: string,
    data: UpdateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> {
    const response = await apiClient.put(
      `/api/settings/unavailability-blocks/${id}`,
      data
    );
    return handleApiResponse(response);
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
