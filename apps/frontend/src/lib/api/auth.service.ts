import {
  AuthResponseDto,
  User,
  UpdateUserHandleDto,
} from '@ht-cal-01/shared-types';
import { apiClient, getTokens } from './client';

export class AuthService {
  async loginWithFirebase(firebaseToken: string): Promise<AuthResponseDto> {
    return apiClient.post<AuthResponseDto>('/api/auth/firebase-login', {
      idToken: firebaseToken,
    });
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = getTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return apiClient.post<{
      accessToken: string;
      refreshToken: string;
    }>('/api/auth/refresh', { refreshToken });
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/api/auth/me');
  }

  async logout(): Promise<void> {
    const { refreshToken } = getTokens();
    await apiClient.post('/api/auth/logout', { refreshToken });
  }

  async updateHandle(data: UpdateUserHandleDto): Promise<User> {
    return apiClient.put<User>('/api/auth/handle', data);
  }
}

export const authService = new AuthService();
