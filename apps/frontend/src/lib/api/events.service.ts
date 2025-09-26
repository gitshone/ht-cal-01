import { apiClient } from './client';
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

    const result = await apiClient.get<{ events: Event[] }>(
      `/api/events?${params.toString()}`
    );

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
    return apiClient.post<Event>('/api/events', eventData);
  }

  /**
   * Update an event
   */
  async updateEvent(
    eventId: string,
    eventData: UpdateEventDto
  ): Promise<Event> {
    return apiClient.patch<Event>(`/api/events/${eventId}`, eventData);
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/api/events/${eventId}`);
  }

  /**
   * Get a single event by ID
   */
  async getEventById(eventId: string): Promise<Event> {
    return apiClient.get<Event>(`/api/events/${eventId}`);
  }
}

export const eventsService = new EventsService();
