import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '@ht-cal-01/shared-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh?: string) => {
  accessToken = access;
  localStorage.setItem('accessToken', access);
  if (refresh) {
    refreshToken = refresh;
    localStorage.setItem('refreshToken', refresh);
  }
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

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Prevent automatic date serialization
  transformRequest: [
    data => {
      // Don't transform FormData - let axios handle it properly
      if (data instanceof FormData) {
        return data;
      }

      // Ensure dates are sent as plain strings without automatic conversion
      if (data && typeof data === 'object') {
        const serialized = JSON.stringify(data, (key, value) => {
          // If it's a date string, ensure it's sent as-is
          if (
            typeof value === 'string' &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
          ) {
            return value;
          }
          return value;
        });
        return serialized;
      }
      return JSON.stringify(data);
    },
  ],
});

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

// Response interceptor to handle token refresh and validation errors
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 400) {
      const validationError = new Error(
        error.response.data.error ||
          error.response.data.message ||
          'Validation failed'
      );
      (validationError as any).response = error.response;
      (validationError as any).fieldErrors =
        error.response.data.fieldErrors || {};
      (validationError as any).message = error.response.data.message;
      (validationError as any).status = error.response.status;

      return Promise.reject(validationError);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response.data?.errorCode !== 'NO_GOOGLE_TOKENS' &&
      error.response.data?.errorCode !== 'GOOGLE_AUTH_EXPIRED' &&
      error.response.data?.errorCode !== 'CALENDAR_ACCESS_DENIED'
    ) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = getTokens();
        if (!refreshToken) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post<
          ApiResponse<{ accessToken: string; refreshToken: string }>
        >(
          `${API_URL}/api/auth/refresh`,
          { refreshToken },
          {
            withCredentials: true,
          }
        );

        if (response.data.success && response.data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data.data;
          setTokens(newAccessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API response handler
export const handleApiResponse = <T>(
  response: AxiosResponse<ApiResponse<T>>
): T => {
  if (response.data.success) {
    return response.data.data as T;
  }

  const error = new Error(response.data.error || 'API request failed');
  (error as any).errorCode = response.data.errorCode;
  (error as any).status = response.status;
  (error as any).fieldErrors = (response.data as any).fieldErrors || {};
  (error as any).message = (response.data as any).message;
  (error as any).response = response;

  throw error;
};

export default apiClient;
