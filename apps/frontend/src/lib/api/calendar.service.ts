import { AxiosResponse } from 'axios';
import {
  CalendarListParams,
  CalendarListResponse,
  ApiResponse,
} from '@ht-cal-01/shared-types';
import { apiClient, handleApiResponse } from './client';

export class CalendarService {
  async getEvents(
    googleCode?: string,
    params?: CalendarListParams
  ): Promise<CalendarListResponse> {
    const headers: Record<string, string> = {};

    if (googleCode) {
      headers['x-google-oauth-code'] = googleCode;
    }

    const response: AxiosResponse<ApiResponse<CalendarListResponse>> =
      await apiClient.get('/api/calendar/events', {
        params,
        headers,
      });

    return handleApiResponse(response);
  }
}

export const calendarService = new CalendarService();
