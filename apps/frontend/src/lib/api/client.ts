import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '@ht-cal-01/shared-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

let accessToken: string | null = null;

export const setTokens = (access: string, refresh?: string) => {
  accessToken = access;
  localStorage.setItem('accessToken', access);
};

export const getTokens = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  return { accessToken };
};

export const clearTokens = () => {
  accessToken = null;
  localStorage.removeItem('accessToken');
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Enable sending cookies
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

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response.data?.errorCode !== 'NO_GOOGLE_TOKENS' &&
      error.response.data?.errorCode !== 'GOOGLE_AUTH_EXPIRED' &&
      error.response.data?.errorCode !== 'CALENDAR_ACCESS_DENIED'
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${API_URL}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        if (response.data.success && response.data.data) {
          const newAccessToken = response.data.data.accessToken;
          setTokens(newAccessToken);

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
  (error as any).fieldErrors = (response.data as any).fieldErrors;
  (error as any).message = (response.data as any).message;
  throw error;
};

export default apiClient;
