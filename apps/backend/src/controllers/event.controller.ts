import { Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { jobQueueService } from '../services/jobQueue.service';
import { EVENT_CONSTANTS } from '../constants/events';
import {
  ApiResponse,
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventFilterParams,
  EventListResponse,
} from '@ht-cal-01/shared-types';
import {
  AuthenticationRequiredError,
  MissingRequiredFieldsError,
} from '../errors/http.errors';

export class EventController {
  async getEvents(req: Request, res: Response): Promise<void> {
    const userId = (req as Request & { user?: { userId: string } }).user
      ?.userId;

    if (!userId) {
      throw new AuthenticationRequiredError();
    }

    const params: EventFilterParams & { limit?: number; cursor?: string } = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      dateRange:
        (req.query.dateRange as '1' | '7' | '30') ||
        EVENT_CONSTANTS.DATE_RANGES.ONE_WEEK,
      groupBy:
        (req.query.groupBy as 'day' | 'week') || EVENT_CONSTANTS.GROUP_BY.DAY,
      limit: Number(req.query.limit) || EVENT_CONSTANTS.DEFAULT_LIMIT,
      cursor: req.query.cursor as string,
    };

    const result = await eventService.getEvents(userId, params);

    const response: ApiResponse<EventListResponse> = {
      success: true,
      data: result,
      message: `Successfully retrieved events`,
    };

    res.status(200).json(response);
  }

  async createEvent(req: Request, res: Response): Promise<void> {
    const userId = (req as Request & { user?: { userId: string } }).user
      ?.userId;

    if (!userId) {
      throw new AuthenticationRequiredError();
    }

    const eventData: CreateEventDto = req.body;

    const event = await eventService.createEvent(userId, eventData);

    const response: ApiResponse<Event> = {
      success: true,
      data: event,
      message: 'Event created successfully',
    };

    res.status(201).json(response);
  }

  async updateEvent(req: Request, res: Response): Promise<void> {
    const userId = (req as Request & { user?: { userId: string } }).user
      ?.userId;

    if (!userId) {
      throw new AuthenticationRequiredError();
    }

    const { id } = req.params;
    if (!id) {
      throw new MissingRequiredFieldsError('Event ID is required');
    }

    const eventData: UpdateEventDto = req.body;

    const event = await eventService.updateEvent(userId, id, eventData);

    const response: ApiResponse<Event> = {
      success: true,
      data: event,
      message: 'Event updated successfully',
    };

    res.status(200).json(response);
  }

  async deleteEvent(req: Request, res: Response): Promise<void> {
    const userId = (req as Request & { user?: { userId: string } }).user
      ?.userId;

    if (!userId) {
      throw new AuthenticationRequiredError();
    }

    const { id } = req.params;
    if (!id) {
      throw new MissingRequiredFieldsError('Event ID is required');
    }

    await eventService.deleteEvent(userId, id);

    const response: ApiResponse = {
      success: true,
      message: 'Event deleted successfully',
    };

    res.status(200).json(response);
  }

  async syncEvents(req: Request, res: Response): Promise<void> {
    const userId = (req as Request & { user?: { userId: string } }).user
      ?.userId;

    if (!userId) {
      throw new AuthenticationRequiredError();
    }

    // Add sync job to background queue
    const jobId = await jobQueueService.addJob(
      EVENT_CONSTANTS.JOB_TYPES.SYNC_EVENTS,
      { userId }
    );

    const response: ApiResponse<{ jobId: string; status: string }> = {
      success: true,
      data: {
        jobId,
        status: 'pending',
      },
      message: 'Sync job started. Use the job ID to check status.',
    };

    res.status(202).json(response);
  }

  async getSyncStatus(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;

    if (!jobId) {
      throw new MissingRequiredFieldsError('Job ID is required');
    }

    const job = jobQueueService.getJob(jobId);
    if (!job) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof job> = {
      success: true,
      data: job,
      message: `Job status: ${job.status}`,
    };

    res.status(200).json(response);
  }
}
