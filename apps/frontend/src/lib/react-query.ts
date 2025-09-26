import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import {
  isAuthenticationError,
  ValidationError,
  AuthenticationError,
} from './api/errors';

const queryConfig: DefaultOptions = {
  queries: {
    retry: (failureCount, error) => {
      if (isAuthenticationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: (failureCount, error: any) => {
      if (isAuthenticationError(error)) {
        return false;
      }

      if (
        error instanceof ValidationError ||
        error instanceof AuthenticationError
      ) {
        return false;
      }

      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }

      return failureCount < 1;
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

queryClient.setMutationDefaults(['auth'], {
  onError: (error: any) => {
    console.error('Mutation error:', error.message, error.errorCode);
    if (isAuthenticationError(error)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  },
});

// Prefetch and. cache
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },
  events: {
    all: ['events'] as const,
    list: (filters: Record<string, any>) =>
      ['events', 'list', filters] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
  },
  integrations: {
    all: ['integrations'] as const,
    providers: ['integrations', 'providers'] as const,
    detail: (id: string) => ['integrations', 'detail', id] as const,
  },
  settings: {
    all: ['settings'] as const,
    user: (userId: string) => ['settings', 'user', userId] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
} as const;

export const invalidateQueries = {
  auth: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),
  events: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  integrations: () =>
    queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  settings: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  users: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
};

export const prefetchQueries = {
  userProfile: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auth.profile(userId),
      staleTime: 5 * 60 * 1000,
    });
  },

  events: async (filters: Record<string, any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.events.list(filters),
      staleTime: 2 * 60 * 1000,
    });
  },
};

export default queryClient;
