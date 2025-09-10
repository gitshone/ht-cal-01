import { apiClient, handleApiResponse } from './client';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventFilterParams,
  EventListResponse,
} from '@ht-cal-01/shared-types';

export class EventService {
  async getEvents(
    params: EventFilterParams & { limit?: number; cursor?: string } = {}
  ): Promise<EventListResponse> {
    const queryParams = new URLSearchParams();

    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.dateRange) queryParams.append('dateRange', params.dateRange);
    if (params.groupBy) queryParams.append('groupBy', params.groupBy);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const response = await apiClient.get(
      `/api/events?${queryParams.toString()}`
    );
    return handleApiResponse<EventListResponse>(response);
  }

  async createEvent(eventData: CreateEventDto): Promise<Event> {
    const response = await apiClient.post('/api/events', eventData);
    return handleApiResponse<Event>(response);
  }

  async updateEvent(
    eventId: string,
    eventData: UpdateEventDto
  ): Promise<Event> {
    const response = await apiClient.put(`/api/events/${eventId}`, eventData);
    return handleApiResponse<Event>(response);
  }

  async deleteEvent(eventId: string): Promise<void> {
    const response = await apiClient.delete(`/api/events/${eventId}`);
    return handleApiResponse<void>(response);
  }

  async startSync(): Promise<{
    jobId: string;
    status: string;
  }> {
    const response = await apiClient.post('/api/events/sync');
    return handleApiResponse<{
      jobId: string;
      status: string;
    }>(response);
  }

  async getSyncStatus(jobId: string): Promise<{
    id: string;
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    result?: Record<string, unknown>;
  }> {
    const response = await apiClient.get(`/api/events/sync/${jobId}`);
    return handleApiResponse<{
      id: string;
      type: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      createdAt: string;
      startedAt?: string;
      completedAt?: string;
      error?: string;
      result?: Record<string, unknown>;
    }>(response);
  }
}

export const eventService = new EventService();
