import Joi from 'joi';

// Common schemas
const dateSchema = Joi.string().isoDate().required();
const optionalDateSchema = Joi.string().isoDate().optional();
const titleSchema = Joi.string().min(1).max(200).trim().required();
const optionalTitleSchema = Joi.string().min(1).max(200).trim().optional();
const booleanSchema = Joi.boolean().optional();

// Pagination schemas
export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  cursor: Joi.string().base64().optional(),
});

// Event filter schemas
export const eventFilterSchema = Joi.object({
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
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

// Event creation schema
export const createEventSchema = Joi.object({
  title: titleSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  isAllDay: booleanSchema,
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

// Event update schema
export const updateEventSchema = Joi.object({
  title: optionalTitleSchema,
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  isAllDay: booleanSchema,
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

// Job ID schema
export const jobIdSchema = Joi.object({
  jobId: Joi.string().uuid().required(),
});

// Event ID schema
export const eventIdSchema = Joi.object({
  id: Joi.string().required(),
});
