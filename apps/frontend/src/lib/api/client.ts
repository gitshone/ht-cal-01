import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '@ht-cal-01/shared-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const getTokens = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  if (!refreshToken) {
    refreshToken = localStorage.getItem('refreshToken');
  }
  return { accessToken, refreshToken };
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const { accessToken } = getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken: currentRefreshToken } = getTokens();

      if (currentRefreshToken) {
        try {
          const response = await axios.post<
            ApiResponse<{ accessToken: string }>
          >(`${API_URL}/api/auth/refresh`, {
            refreshToken: currentRefreshToken,
          });

          if (response.data.success && response.data.data) {
            const newAccessToken = response.data.data.accessToken;
            setTokens(newAccessToken, currentRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Generic API response handler
export const handleApiResponse = <T>(
  response: AxiosResponse<ApiResponse<T>>
): T => {
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error || 'API request failed');
};

export default apiClient;
