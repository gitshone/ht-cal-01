export interface ApiErrorResponse {
  message: string;
  fieldErrors?: Record<string, string>;
  error?: string;
  statusCode: number;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly fieldErrors: Record<string, string>;
  public readonly errorCode: string;
  public readonly response?: any;

  constructor(
    message: string,
    status: number,
    errorCode = 'API_ERROR',
    fieldErrors: Record<string, string> = {},
    response?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
    this.response = response;
  }

  static fromResponse(response: any): ApiError {
    const data = response.data || {};
    return new ApiError(
      data.message || 'API request failed',
      response.status,
      data.error || 'API_ERROR',
      data.fieldErrors || {},
      response
    );
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message, 400, 'VALIDATION_ERROR', fieldErrors);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network error occurred') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'Request timeout') {
    super(message, 408, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

export class ServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
    this.name = 'ServerError';
  }
}

export class OfflineError extends ApiError {
  constructor(message = 'You are offline') {
    super(message, 0, 'OFFLINE');
    this.name = 'OfflineError';
  }
}

export const isApiError = (error: any): error is ApiError => {
  return error instanceof ApiError;
};

export const isValidationError = (error: any): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isAuthenticationError = (
  error: any
): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isNetworkError = (error: any): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isTimeoutError = (error: any): error is TimeoutError => {
  return error instanceof TimeoutError;
};

export const isOfflineError = (error: any): error is OfflineError => {
  return error instanceof OfflineError;
};
