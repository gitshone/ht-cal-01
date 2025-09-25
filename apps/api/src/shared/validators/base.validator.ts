import Joi from 'joi';

export abstract class BaseValidator {
  protected validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorMessages = error.details
        .map(detail => detail.message)
        .join(', ');
      throw new Error(`Validation error: ${errorMessages}`);
    }

    return value;
  }

  protected validateQuery<T>(schema: Joi.ObjectSchema<T>, query: unknown): T {
    return this.validate(schema, query);
  }

  public validateBody<T>(schema: Joi.ObjectSchema<T>, body: unknown): T {
    return this.validate(schema, body);
  }

  public validateParams<T>(schema: Joi.ObjectSchema<T>, params: unknown): T {
    return this.validate(schema, params);
  }

  protected formatValidationErrors(
    error: Joi.ValidationError
  ): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    error.details.forEach(detail => {
      const field = detail.path.join('.');
      fieldErrors[field] = detail.message;
    });
    return fieldErrors;
  }
}
