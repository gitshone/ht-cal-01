import { Request, Response } from 'express';
import { CalendarService } from '../services/calendar.service';
import { googleOAuthService } from '../services/googleOAuth.service';
import {
  ApiResponse,
  CalendarListParams,
  CalendarListResponse,
} from '@ht-cal-01/shared-types';
import {
  AuthenticationRequiredError,
  MissingRequiredFieldsError,
  GoogleApiError,
} from '../errors/http.errors';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class CalendarController {
  private calendarService: CalendarService;

  constructor() {
    this.calendarService = new CalendarService();
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { user?: { userId: string } }).user
        ?.userId;

      if (!userId) {
        throw new AuthenticationRequiredError();
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
        message: `Successfully retrieved ${events.events.length} calendar events`,
      };

      res.status(200).json(response);
    } catch {
      throw new GoogleApiError(
        'Unable to retrieve calendar events. Please try again.'
      );
    }
  }

  async connectCalendar(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { user?: { userId: string } }).user
        ?.userId;

      if (!userId) {
        throw new AuthenticationRequiredError();
      }

      const googleCode = req.headers['x-google-oauth-code'] as string;
      if (!googleCode) {
        throw new MissingRequiredFieldsError(
          'Authorization code required to connect calendar'
        );
      }

      // Exchange code for tokens and store them
      await googleOAuthService.exchangeCodeForTokens(userId, googleCode);

      const response: ApiResponse = {
        success: true,
        message: 'Google Calendar connected successfully',
      };

      res.status(200).json(response);
    } catch {
      throw new GoogleApiError('Unable to connect calendar. Please try again.');
    }
  }

  async disconnectCalendar(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { user?: { userId: string } }).user
        ?.userId;

      if (!userId) {
        throw new AuthenticationRequiredError();
      }

      // Remove Google OAuth tokens from user
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleOauthTokens: Prisma.JsonNull,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Google Calendar disconnected successfully',
      };

      res.status(200).json(response);
    } catch {
      throw new GoogleApiError(
        'Unable to disconnect calendar. Please try again.'
      );
    }
  }
}
