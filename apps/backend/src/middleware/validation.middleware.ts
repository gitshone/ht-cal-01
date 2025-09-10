import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Joi validation middleware factory
 */
export const validate = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Show all validation errors
      stripUnknown: true, // Remove unknown properties
      convert: true, // Convert types when possible
    });

    if (error) {
      // Format errors as field-specific errors
      const fieldErrors: Record<string, string> = {};
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        fieldErrors[field] = detail.message;
      });

      const response = {
        success: false,
        error: 'Validation failed',
        fieldErrors,
        message: 'Please check the form for errors',
      };

      res.status(400).json(response);
      return;
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Validation middleware for query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) =>
  validate(schema, 'query');

/**
 * Validation middleware for request body
 */
export const validateBody = (schema: Joi.ObjectSchema) =>
  validate(schema, 'body');

/**
 * Validation middleware for URL parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) =>
  validate(schema, 'params');
