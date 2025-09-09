import { AxiosResponse } from 'axios';
import {
  CalendarListParams,
  CalendarListResponse,
  ApiResponse,
} from '@ht-cal-01/shared-types';
import { apiClient, handleApiResponse } from './client';

export class CalendarService {
  async getEvents(params?: CalendarListParams): Promise<CalendarListResponse> {
    const response: AxiosResponse<ApiResponse<CalendarListResponse>> =
      await apiClient.get('/api/calendar/events', {
        params,
      });

    return handleApiResponse(response);
  }

  async connectCalendar(googleCode: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await apiClient.post(
      '/api/calendar/connect',
      {},
      {
        headers: {
          'x-google-oauth-code': googleCode,
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to connect calendar');
    }
  }

  async disconnectCalendar(): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await apiClient.delete(
      '/api/calendar/disconnect'
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to disconnect calendar');
    }
  }
}

export const calendarService = new CalendarService();
