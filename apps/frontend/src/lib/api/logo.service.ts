import { apiClient } from './client';
import { UserSettings } from '@ht-cal-01/shared-types';

export interface LogoUploadResponse {
  status: string;
  data: UserSettings;
  message: string;
}

export interface LogoDeleteResponse {
  status: string;
  data: UserSettings;
  message: string;
}

export const logoService = {
  async uploadLogo(file: File): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post('/api/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async deleteLogo(): Promise<LogoDeleteResponse> {
    const response = await apiClient.delete('/api/settings/logo');
    return response.data;
  },
};
