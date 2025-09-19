import Joi from 'joi';
import { BaseValidator } from '../../core/base.validator';

export class EventsValidator extends BaseValidator {
  private readonly dateSchema = Joi.string().isoDate().required();
  private readonly optionalDateSchema = Joi.string().isoDate().optional();
  private readonly titleSchema = Joi.string().min(1).max(200).trim().required();
  private readonly optionalTitleSchema = Joi.string()
    .min(1)
    .max(200)
    .trim()
    .optional();
  private readonly booleanSchema = Joi.boolean().optional();

  private readonly paginationSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional(),
    cursor: Joi.string().base64().optional(),
  });

  private readonly eventFilterSchema = Joi.object({
    startDate: this.optionalDateSchema,
    endDate: this.optionalDateSchema,
    dateRange: Joi.string().valid('1', '7', '30').optional(),
    groupBy: Joi.string().valid('day', 'week').optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    cursor: Joi.string().base64().optional(),
  })
    .custom((value, helpers) => {
      if (value.startDate && value.endDate) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        if (start >= end) {
          return helpers.error('dateRange.invalid');
        }
      }
      return value;
    })
    .messages({
      'dateRange.invalid': 'startDate must be before endDate',
    });

  private readonly createEventSchema = Joi.object({
    title: this.titleSchema,
    startDate: this.dateSchema,
    endDate: this.dateSchema,
    isAllDay: this.booleanSchema,
  })
    .custom((value, helpers) => {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      if (start >= end) {
        return helpers.error('eventDates.invalid');
      }
      return value;
    })
    .messages({
      'eventDates.invalid': 'startDate must be before endDate',
    });

  private readonly updateEventSchema = Joi.object({
    title: this.optionalTitleSchema,
    startDate: this.optionalDateSchema,
    endDate: this.optionalDateSchema,
    isAllDay: this.booleanSchema,
  })
    .custom((value, helpers) => {
      if (value.startDate && value.endDate) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        if (start >= end) {
          return helpers.error('eventDates.invalid');
        }
      }
      return value;
    })
    .messages({
      'eventDates.invalid': 'startDate must be before endDate',
    });

  private readonly eventIdSchema = Joi.object({
    id: Joi.string().required(),
  });

  private readonly jobIdSchema = Joi.object({
    jobId: Joi.string().uuid().required(),
  });

  getEventFilterSchema() {
    return this.eventFilterSchema;
  }

  getCreateEventSchema() {
    return this.createEventSchema;
  }

  getUpdateEventSchema() {
    return this.updateEventSchema;
  }

  getEventIdSchema() {
    return this.eventIdSchema;
  }

  getJobIdSchema() {
    return this.jobIdSchema;
  }

  validatePagination(query: unknown) {
    return this.validateQuery(this.paginationSchema, query);
  }
}

export const eventsValidator = new EventsValidator();
