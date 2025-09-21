import { AxiosResponse } from 'axios';
import {
  AuthResponseDto,
  FirebaseAuthDto,
  ApiResponse,
  User,
  UpdateUserHandleDto,
} from '@ht-cal-01/shared-types';
import { apiClient, handleApiResponse } from './client';

export class AuthService {
  async loginWithFirebase(firebaseToken: string): Promise<AuthResponseDto> {
    const response: AxiosResponse<ApiResponse<AuthResponseDto>> =
      await apiClient.post('/api/auth/login/firebase', {
        firebaseToken,
      } as FirebaseAuthDto);

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
    await apiClient.post('/api/auth/logout');
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
