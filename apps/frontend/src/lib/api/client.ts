import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@ht-cal-01/shared-types';
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  ServerError,
  OfflineError,
  isNetworkError,
  isTimeoutError,
} from './errors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_BASE = 500;

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

const pendingRequests = new Map<string, Promise<any>>();

let isOnline = navigator.onLine;
const offlineQueue: Array<() => Promise<any>> = [];

window.addEventListener('online', () => {
  isOnline = true;
  processOfflineQueue();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

// Exponential backoff retry
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRY_ATTEMPTS,
  baseDelay: number = RETRY_DELAY_BASE
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0 || !shouldRetry(error)) {
      throw error;
    }

    const delay = baseDelay * Math.pow(2, MAX_RETRY_ATTEMPTS - retries);
    await sleep(delay);

    return retryWithBackoff(fn, retries - 1, baseDelay);
  }
};

const shouldRetry = (error: any): boolean => {
  // Don't retry validation errors or other client errors
  if (
    error instanceof ValidationError ||
    error instanceof AuthenticationError
  ) {
    return false;
  }

  // Don't retry client errors (4xx) - these are usually user errors
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return false;
  }

  // Retry network errors, timeouts, and 5xx server errors
  return (
    isNetworkError(error) ||
    isTimeoutError(error) ||
    (error.response?.status >= 500 && error.response?.status < 600)
  );
};

// Process offline queue when coming back online
const processOfflineQueue = async () => {
  while (offlineQueue.length > 0 && isOnline) {
    const request = offlineQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Failed to process offline request:', error);
      }
    }
  }
};

// Generate request key for deduplication
const generateRequestKey = (config: AxiosRequestConfig): string => {
  const { method, url, data, params } = config;
  return `${method}:${url}:${JSON.stringify(data)}:${JSON.stringify(params)}`;
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [
    data => {
      if (data instanceof FormData) {
        return data;
      }

      if (data && typeof data === 'object') {
        const serialized = JSON.stringify(data, (key, value) => {
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

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  config => {
    const { accessToken } = getTokens();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;

    if (!isOnline) {
      if (originalRequest.method === 'get') {
        throw new OfflineError(
          'You are offline. This request will be retried when you come back online.'
        );
      } else {
        offlineQueue.push(() => axiosInstance(originalRequest));
        throw new OfflineError(
          'You are offline. This request has been queued and will be sent when you come back online.'
        );
      }
    }

    if (error.response?.status === 400) {
      const data = error.response.data || {};
      throw new ValidationError(
        data.message || 'Validation failed',
        data.fieldErrors || {}
      );
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = getTokens();
        if (!refreshToken) {
          clearTokens();
          processQueue(
            new AuthenticationError('No refresh token available'),
            null
          );
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

          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data || {};

      switch (status) {
        case 403:
          throw new AuthenticationError(data.message || 'Access denied');
        case 404:
          throw new ApiError(
            data.message || 'Resource not found',
            404,
            'NOT_FOUND'
          );
        case 408:
          throw new TimeoutError(data.message || 'Request timeout');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServerError(data.message || 'Server error');
        default:
          throw ApiError.fromResponse(error.response);
      }
    }

    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timeout');
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      throw new NetworkError('Network error occurred');
    }

    throw ApiError.fromResponse(error.response);
  }
);

export const apiClient = {
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const requestKey = generateRequestKey(config);

    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!;
    }

    const requestPromise = retryWithBackoff(async () => {
      const response = await axiosInstance.request<ApiResponse<T>>(config);
      return handleApiResponse(response);
    });

    pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      pendingRequests.delete(requestKey);
    }
  },

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  },

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  },

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  },

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  },
};

export const handleApiResponse = <T>(
  response: AxiosResponse<ApiResponse<T>>
): T => {
  if (response.data.success) {
    return response.data.data as T;
  }

  throw ApiError.fromResponse(response);
};

export default apiClient;
