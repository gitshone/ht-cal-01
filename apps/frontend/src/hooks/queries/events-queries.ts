import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '../../lib/api/events.service';
import {
  CalendarViewType,
  EventFilterType,
  CreateEventDto,
  UpdateEventDto,
} from '@ht-cal-01/shared-types';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  list: (
    viewType: CalendarViewType,
    startDate: string,
    endDate: string,
    providerFilter?: EventFilterType,
    searchQuery?: string
  ) =>
    [
      ...eventKeys.all,
      'list',
      { viewType, startDate, endDate, providerFilter, searchQuery },
    ] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
};

// Hooks
export const useEvents = (
  viewType: CalendarViewType,
  startDate: string,
  endDate: string,
  providerFilter?: EventFilterType,
  searchQuery?: string
) => {
  return useQuery({
    queryKey: eventKeys.list(
      viewType,
      startDate,
      endDate,
      providerFilter,
      searchQuery
    ),
    queryFn: async () => {
      return await eventsService.getEvents(
        viewType,
        startDate,
        endDate,
        providerFilter,
        searchQuery
      );
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
    mutationFn: (data: CreateEventDto) => eventsService.createEvent(data),
    onSuccess: () => {
      // Invalidate all event queries to refresh the data
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) =>
      eventsService.updateEvent(id, data),
    onSuccess: (data, variables) => {
      // Invalidate all event list queries to refresh the data
      queryClient.invalidateQueries({ queryKey: eventKeys.all });

      // Also update the specific event detail cache if it exists
      queryClient.setQueryData(eventKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsService.deleteEvent(id),
    onSuccess: (_, id) => {
      // Remove the specific event from cache
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) });
      // Invalidate all event queries to refresh the data
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

export const useEventById = (eventId: string) => {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: async () => {
      return await eventsService.getEventById(eventId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
    enabled: !!eventId,
  });
};
