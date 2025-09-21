import Joi from 'joi';
import { BaseValidator } from '../../core/base.validator';

export class QueueValidator extends BaseValidator {
  private readonly jobIdSchema = Joi.object({
    jobId: Joi.string().required(),
  });

  private readonly addJobSchema = Joi.object({
    type: Joi.string().required(),
    data: Joi.object().required(),
  });

  private readonly connectCalendarSchema = Joi.object({
    googleCode: Joi.string().required(),
  });

  private readonly queueNameSchema = Joi.object({
    queueName: Joi.string()
      .valid('sync-events', 'connect-calendar', 'cleanup-tokens')
      .required(),
  });

  getJobIdSchema() {
    return this.jobIdSchema;
  }

  getAddJobSchema() {
    return this.addJobSchema;
  }

  getConnectCalendarSchema() {
    return this.connectCalendarSchema;
  }

  getQueueNameSchema() {
    return this.queueNameSchema;
  }
}
