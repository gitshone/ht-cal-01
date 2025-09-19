import Joi from 'joi';
import { BaseValidator } from '../../core/base.validator';

export class AuthValidator extends BaseValidator {
  private readonly firebaseAuthSchema = Joi.object({
    firebaseToken: Joi.string().required(),
  });

  private readonly refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().optional(),
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
}

export const authValidator = new AuthValidator();
