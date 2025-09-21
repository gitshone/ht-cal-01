import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../../lib/api';
import {
  EventFilterParams,
  CreateEventDto,
  UpdateEventDto,
} from '@ht-cal-01/shared-types';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: EventFilterParams) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

// Hooks
export const useEvents = (params: EventFilterParams) => {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: async () => {
      return await eventService.getEvents(params);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: true,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventDto) => eventService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) =>
      eventService.updateEvent(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(eventKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};
