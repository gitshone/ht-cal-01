import Joi from 'joi';
import { BaseValidator } from '../../core/base.validator';

export class CalendarValidator extends BaseValidator {
  private readonly connectCalendarSchema = Joi.object({
    googleCode: Joi.string().required(),
  });

  validateConnectCalendar(data: unknown) {
    return this.validateBody(this.connectCalendarSchema, data);
  }

  getConnectCalendarSchema() {
    return this.connectCalendarSchema;
  }
}

export const calendarValidator = new CalendarValidator();
