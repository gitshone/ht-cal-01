import { apiClient, handleApiResponse } from './client';
import {
  Event,
  CalendarViewType,
  EventFilterType,
  EventResponse,
  CreateEventDto,
  UpdateEventDto,
} from '@ht-cal-01/shared-types';

export class EventsService {
  /**
   * Get events for a specific time range
   */
  async getEvents(
    viewType: CalendarViewType,
    startDate: string,
    endDate: string,
    providerFilter?: EventFilterType,
    searchQuery?: string
  ): Promise<EventResponse> {
    const params = new URLSearchParams();
    params.append('viewType', viewType);
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    if (providerFilter && providerFilter !== 'all') {
      params.append('providerFilter', providerFilter);
    }

    if (searchQuery) {
      params.append('searchQuery', searchQuery);
    }

    const response = await apiClient.get(`/api/events?${params.toString()}`);
    const result = handleApiResponse<{ events: Event[] }>(response);

    return {
      events: result.events,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      viewType,
      totalCount: result.events.length,
    };
  }

  /**
   * Create an event
   */
  async createEvent(eventData: CreateEventDto): Promise<Event> {
    const response = await apiClient.post('/api/events', eventData);
    return handleApiResponse<Event>(response);
  }

  /**
   * Update an event
   */
  async updateEvent(
    eventId: string,
    eventData: UpdateEventDto
  ): Promise<Event> {
    const response = await apiClient.patch(`/api/events/${eventId}`, eventData);
    return handleApiResponse<Event>(response);
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const response = await apiClient.delete(`/api/events/${eventId}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete event');
    }
  }

  /**
   * Get a single event by ID
   */
  async getEventById(eventId: string): Promise<Event> {
    const response = await apiClient.get(`/api/events/${eventId}`);
    return handleApiResponse<Event>(response);
  }
}

export const eventsService = new EventsService();
