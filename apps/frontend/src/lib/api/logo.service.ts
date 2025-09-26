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

    return apiClient.post<LogoUploadResponse>('/api/settings/logo', formData);
  },

  async deleteLogo(): Promise<LogoDeleteResponse> {
    return apiClient.delete<LogoDeleteResponse>('/api/settings/logo');
  },
};
