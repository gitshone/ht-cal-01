import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  async getQueueStats(): Promise<any> {
    this.logger.log('Getting queue stats');
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  }

  async addJob(name: string, _data: any): Promise<string> {
    this.logger.log(`Adding job: ${name}`);
    return `job-${Date.now()}`;
  }
}
