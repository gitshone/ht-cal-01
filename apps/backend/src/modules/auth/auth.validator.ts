import Joi from 'joi';
import { BaseValidator } from '../../core/base.validator';

export class AuthValidator extends BaseValidator {
  private readonly firebaseAuthSchema = Joi.object({
    firebaseToken: Joi.string().required(),
  });

  private readonly refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().optional(),
  });

  private readonly updateHandleSchema = Joi.object({
    handle: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required()
      .messages({
        'string.min': 'Handle must be at least 3 characters long',
        'string.max': 'Handle must be no more than 30 characters long',
        'string.pattern.base':
          'Handle can only contain letters, numbers, underscores, and hyphens',
        'any.required': 'Handle is required',
      }),
  });

  validateFirebaseAuth(data: unknown) {
    return this.validateBody(this.firebaseAuthSchema, data);
  }

  getFirebaseAuthSchema() {
    return this.firebaseAuthSchema;
  }

  getRefreshTokenSchema() {
    return this.refreshTokenSchema;
  }

  validateUpdateHandle(data: unknown) {
    return this.validateBody(this.updateHandleSchema, data);
  }

  getUpdateHandleSchema() {
    return this.updateHandleSchema;
  }
}
