import { Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { jobQueueService } from '../services/jobQueue.service';
import { ApiResponse } from '@ht-cal-01/shared-types';
import {
  AuthenticationRequiredError,
  MissingRequiredFieldsError,
  GoogleApiError,
} from '../errors/http.errors';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { EVENT_CONSTANTS } from '../constants/events';

export class CalendarController {
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

      // Add calendar connection job to queue
      const jobId = await jobQueueService.addJob(
        EVENT_CONSTANTS.JOB_TYPES.CONNECT_CALENDAR,
        {
          userId,
          googleCode,
        }
      );

      const response: ApiResponse<{ jobId: string }> = {
        success: true,
        data: { jobId },
        message:
          'Calendar connection started. You will be notified when complete.',
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

      // Clear all events for this user
      await eventService.clearUserEvents(userId);

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
