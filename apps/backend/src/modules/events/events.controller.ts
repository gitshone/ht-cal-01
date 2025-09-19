import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller';
import { eventsService } from './events.service';
import { queueService } from '../queue';
import { EVENT_CONSTANTS } from '@ht-cal-01/shared-types';

export class EventsController extends BaseController {
  async getEvents(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const validatedParams = req.query as Record<string, unknown>;

    const result = await eventsService.getEvents(userId, validatedParams);

    this.sendSuccess(res, result, 'Successfully retrieved events');
  }

  async createEvent(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const validatedData = req.body;

    const event = await eventsService.createEvent(userId, validatedData);

    this.sendSuccess(res, event, 'Event created successfully', 201);
  }

  async updateEvent(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const validatedParams = req.params as Record<string, string>;
    const validatedData = req.body;

    const event = await eventsService.updateEvent(
      userId,
      validatedParams.id,
      validatedData
    );

    this.sendSuccess(res, event, 'Event updated successfully');
  }

  async deleteEvent(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const validatedParams = req.params as Record<string, string>;

    await eventsService.deleteEvent(userId, validatedParams.id);

    this.sendSuccess(res, null, 'Event deleted successfully');
  }

  async syncEvents(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const jobId = await queueService.addJob(
      EVENT_CONSTANTS.JOB_TYPES.SYNC_EVENTS,
      { userId }
    );

    this.sendSuccess(
      res,
      {
        jobId,
        status: 'pending',
      },
      'Sync job started. Use the job ID to check status.',
      202
    );
  }

  async getSyncStatus(req: Request, res: Response) {
    const validatedParams = req.params as Record<string, string>;
    const job = await queueService.getJob(validatedParams.jobId);

    if (!job) {
      this.sendError(res, 'Job not found', 404);
      return;
    }

    this.sendSuccess(res, job, `Job status: ${job.status}`);
  }
}

export const eventsController = new EventsController();
