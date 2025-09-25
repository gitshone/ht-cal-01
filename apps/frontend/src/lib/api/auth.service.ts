import { AxiosResponse } from 'axios';
import {
  AuthResponseDto,
  ApiResponse,
  User,
  UpdateUserHandleDto,
} from '@ht-cal-01/shared-types';
import { apiClient, handleApiResponse, getTokens } from './client';

export class AuthService {
  async loginWithFirebase(firebaseToken: string): Promise<AuthResponseDto> {
    const response: AxiosResponse<ApiResponse<AuthResponseDto>> =
      await apiClient.post('/api/auth/firebase-login', {
        idToken: firebaseToken, // Changed from firebaseToken to idToken to match new API
      });

    return handleApiResponse(response);
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const response: AxiosResponse<ApiResponse<{ accessToken: string }>> =
      await apiClient.post('/api/auth/refresh');

    return handleApiResponse(response);
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.get(
      '/api/auth/me'
    );

    return handleApiResponse(response);
  }

  async logout(): Promise<void> {
    const { refreshToken } = getTokens();
    await apiClient.post('/api/auth/logout', { refreshToken });
  }

  async updateHandle(data: UpdateUserHandleDto): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.put(
      '/api/auth/handle',
      data
    );

    return handleApiResponse(response);
  }
}

export const authService = new AuthService();
