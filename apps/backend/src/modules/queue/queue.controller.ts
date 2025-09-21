import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller';
import { QueueService } from './queue.service';

export class QueueController extends BaseController {
  constructor(private queueService: QueueService) {
    super();
  }
  async getJobStatus(req: Request, res: Response) {
    const validatedParams = req.params as Record<string, string>;
    const job = await this.queueService.getJob(validatedParams.jobId);

    if (!job) {
      this.sendError(res, 'Job not found', 404);
      return;
    }

    this.sendSuccess(res, job, `Job status: ${job.status}`);
  }

  async addJob(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const validatedData = req.body;

    const jobId = await this.queueService.addJob(validatedData.type, {
      ...validatedData.data,
      userId,
    });

    this.sendSuccess(
      res,
      {
        jobId,
        status: 'pending',
      },
      'Job added to queue',
      202
    );
  }

  async connectCalendar(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const validatedData = req.body;

    const jobId = await this.queueService.addJob('connect_calendar', {
      userId,
      googleCode: validatedData.googleCode,
    });

    this.sendSuccess(
      res,
      {
        jobId,
        status: 'pending',
      },
      'Calendar connection job started',
      202
    );
  }

  async getQueueStats(req: Request, res: Response) {
    const stats = await this.queueService.getQueueStats();
    this.sendSuccess(res, stats, 'Queue statistics retrieved');
  }

  async pauseQueue(req: Request, res: Response) {
    const validatedParams = req.params as Record<string, string>;
    const queueName = validatedParams.queueName;

    await this.queueService.pauseQueue(queueName);
    this.sendSuccess(res, null, `Queue ${queueName} paused`);
  }

  async resumeQueue(req: Request, res: Response) {
    const validatedParams = req.params as Record<string, string>;
    const queueName = validatedParams.queueName;

    await this.queueService.resumeQueue(queueName);
    this.sendSuccess(res, null, `Queue ${queueName} resumed`);
  }
}
