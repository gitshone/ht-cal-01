import Joi from 'joi';

export abstract class BaseValidator {
  protected validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
    const { error, value } = schema.validate(data, { abortEarly: false });

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

  protected validateParams<T>(schema: Joi.ObjectSchema<T>, params: unknown): T {
    return this.validate(schema, params);
  }
}
