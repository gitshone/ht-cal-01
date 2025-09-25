import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let fieldErrors: Record<string, string> = {};
    let errorCode: string | undefined;

    if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        if (responseObj.fieldErrors) {
          message = responseObj.message || 'Validation failed';
          fieldErrors = responseObj.fieldErrors;
          errorCode = responseObj.error || 'VALIDATION_ERROR';
        } else {
          message = 'Validation failed';
          fieldErrors = { general: responseObj.message || exception.message };
          errorCode = 'VALIDATION_ERROR';
        }
      } else {
        message = 'Validation failed';
        fieldErrors = { general: exception.message };
        errorCode = 'VALIDATION_ERROR';
      }
    } else if (exception instanceof Error) {
      status = 500;
      message = 'Internal server error';
      fieldErrors = { general: exception.message };
      errorCode = 'INTERNAL_ERROR';
    } else {
      status = 500;
      message = 'Internal server error';
      fieldErrors = { general: 'An unexpected error occurred' };
      errorCode = 'UNKNOWN_ERROR';
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception
    );

    Sentry.withScope(scope => {
      if (request.user) {
        const user = request.user as any;
        scope.setUser({
          id: user.id || user.userId,
          email: user.email,
        });
      }

      scope.setContext('request', {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        query: request.query,
        params: request.params,
      });

      scope.setTag(
        'error_type',
        status >= 500 ? 'server_error' : 'client_error'
      );
      scope.setTag('http_status', status.toString());
      scope.setTag('endpoint', `${request.method} ${request.url}`);

      scope.addBreadcrumb({
        message: `Request failed: ${request.method} ${request.url}`,
        category: 'http',
        level: status >= 500 ? 'error' : 'warning',
        data: {
          status,
          message,
          errorCode,
          fieldErrors,
        },
      });

      Sentry.captureException(exception);
    });

    response.status(status).json({
      message,
      fieldErrors,
      error: errorCode,
      statusCode: status,
    });
  }
}
