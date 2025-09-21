import Joi from 'joi';
import { BaseValidator } from '../../core/base.validator';

export class SettingsValidator extends BaseValidator {
  private workingHoursSchema = Joi.object({
    start: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    end: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
  })
    .custom((value, helpers) => {
      if (value.start >= value.end) {
        return helpers.error('custom.startBeforeEnd');
      }
      return value;
    }, 'Time validation')
    .messages({
      'custom.startBeforeEnd': 'Start time must be before end time',
    });

  private defaultWorkingHoursSchema = Joi.object({
    monday: this.workingHoursSchema.optional(),
    tuesday: this.workingHoursSchema.optional(),
    wednesday: this.workingHoursSchema.optional(),
    thursday: this.workingHoursSchema.optional(),
    friday: this.workingHoursSchema.optional(),
    saturday: this.workingHoursSchema.optional(),
    sunday: this.workingHoursSchema.optional(),
  });

  private availableDurationsSchema = Joi.array()
    .items(Joi.number().valid(15, 30, 45, 60, 90, 120))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one duration must be selected',
      'any.only':
        'Invalid duration. Valid durations are: 15, 30, 45, 60, 90, 120 minutes',
    });

  getUpdateUserSettingsSchema() {
    return Joi.object({
      defaultWorkingHours: this.defaultWorkingHoursSchema.optional(),
      timezone: Joi.string().optional(),
      inviteTitle: Joi.string().max(100).optional(),
      inviteDescription: Joi.string().max(500).optional(),
      inviteLogoUrl: Joi.string().uri().optional(),
      availableDurations: this.availableDurationsSchema.optional(),
      acceptsNewMeetings: Joi.boolean().optional(),
    });
  }

  getCreateUnavailabilityBlockSchema() {
    return Joi.object({
      title: Joi.string().min(1).max(100).required(),
      startTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
      endTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .required(),
      days: Joi.array()
        .items(
          Joi.string().valid(
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
          )
        )
        .min(1)
        .required(),
    })
      .custom((value, helpers) => {
        if (value.startTime >= value.endTime) {
          return helpers.error('custom.startBeforeEnd');
        }
        return value;
      }, 'Time validation')
      .messages({
        'custom.startBeforeEnd': 'Start time must be before end time',
      });
  }

  getUpdateUnavailabilityBlockSchema() {
    return Joi.object({
      title: Joi.string().min(1).max(100).optional(),
      startTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      endTime: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      days: Joi.array()
        .items(
          Joi.string().valid(
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
          )
        )
        .min(1)
        .optional(),
    })
      .custom((value, helpers) => {
        // Only validate time order if both start and end times are provided
        if (
          value.startTime &&
          value.endTime &&
          value.startTime >= value.endTime
        ) {
          return helpers.error('custom.startBeforeEnd');
        }
        return value;
      }, 'Time validation')
      .messages({
        'custom.startBeforeEnd': 'Start time must be before end time',
      });
  }

  getUnavailabilityBlockIdSchema() {
    return Joi.object({
      id: Joi.string().required(),
    });
  }
}
