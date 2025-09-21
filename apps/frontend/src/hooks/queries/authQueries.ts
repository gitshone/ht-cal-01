import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../lib/api';
import { User } from '@ht-cal-01/shared-types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

// Hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

export const useRefreshUserData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.getCurrentUser(),
    onSuccess: (data: User) => {
      queryClient.setQueryData(authKeys.currentUser(), data);
    },
  });
};
