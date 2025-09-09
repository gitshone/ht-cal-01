import { Request, Response } from 'express';
import { CalendarService } from '../services/calendar.service';
import {
  ApiResponse,
  CalendarListParams,
  CalendarListResponse,
} from '@ht-cal-01/shared-types';
import { CalendarError } from '../errors/calendar.errors';

export class CalendarController {
  private calendarService: CalendarService;

  constructor() {
    this.calendarService = new CalendarService();
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { user?: { userId: string } }).user?.userId;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: 'User not authenticated',
        };
        res.status(401).json(response);
        return;
      }

      // Parse query parameters
      const params: CalendarListParams = {
        timeMin: req.query.timeMin as string,
        timeMax: req.query.timeMax as string,
        maxResults: req.query.maxResults
          ? parseInt(req.query.maxResults as string)
          : undefined,
        singleEvents: req.query.singleEvents === 'true',
        orderBy: req.query.orderBy as 'startTime' | 'updated',
        pageToken: req.query.pageToken as string,
        syncToken: req.query.syncToken as string,
      };

      const events = await this.calendarService.getEvents(userId, params);

      const response: ApiResponse<CalendarListResponse> = {
        success: true,
        data: events,
        message: 'Events fetched successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching calendar events:', error);

      // Handle CalendarError instances
      if (error instanceof CalendarError) {
        const response: ApiResponse = {
          success: false,
          error: error.userMessage,
        };
        res.status(error.statusCode).json(response);
        return;
      }

      // Fallback for unexpected errors
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch calendar events. Please try again.',
      };
      res.status(500).json(response);
    }
  }
}
