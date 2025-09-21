import {
  BadRequest,
  Unauthorized,
  NotFound,
  InternalServerError,
  Forbidden,
  TooManyRequests,
  Conflict,
} from '@tsed/exceptions';
import { AuthErrorCode, CalendarErrorCode } from '@ht-cal-01/shared-types';

// Auth-related HTTP exceptions
export class AuthenticationRequiredError extends Unauthorized {
  constructor(message = 'Authentication required') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.AUTHENTICATION_REQUIRED,
    };
  }
}

export class InvalidTokenError extends Unauthorized {
  constructor(message = 'Invalid authentication token. Please log in again') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.INVALID_TOKEN,
    };
  }
}

export class TokenExpiredError extends Unauthorized {
  constructor(message = 'Your session has expired. Please log in again') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.TOKEN_EXPIRED,
    };
  }
}

export class FirebaseAuthFailedError extends Unauthorized {
  constructor(message = 'Authentication failed. Please try again') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.FIREBASE_AUTH_FAILED,
    };
  }
}

export class UserNotFoundError extends NotFound {
  constructor(message = 'User not found. Please log in again') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.USER_NOT_FOUND,
    };
  }
}

export class MissingRequiredFieldsError extends BadRequest {
  constructor(message = 'Please provide all required information') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.MISSING_REQUIRED_FIELDS,
    };
  }
}

export class InvalidInputError extends BadRequest {
  constructor(message = 'Please provide valid information') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.INVALID_INPUT,
    };
  }
}

export class BadRequestError extends BadRequest {
  constructor(message = 'Bad request') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.INVALID_INPUT,
    };
  }
}

export class DatabaseError extends InternalServerError {
  constructor(message = 'Database error occurred. Please try again') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.DATABASE_ERROR,
    };
  }
}

export class ExternalServiceError extends InternalServerError {
  constructor(
    message = 'External service unavailable. Please try again later'
  ) {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.EXTERNAL_SERVICE_ERROR,
    };
  }
}

export class RateLimitExceededError extends TooManyRequests {
  constructor(message = 'Too many requests. Please try again later') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.RATE_LIMIT_EXCEEDED,
    };
  }
}

// Calendar-related HTTP exceptions
export class NoGoogleTokensError extends Unauthorized {
  constructor(
    message = 'Google Calendar not connected. Please connect your calendar to view events'
  ) {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: CalendarErrorCode.NO_GOOGLE_TOKENS,
    };
  }
}

export class GoogleAuthExpiredError extends Unauthorized {
  constructor(
    message = 'Google Calendar access expired. Please reconnect your calendar'
  ) {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: CalendarErrorCode.GOOGLE_AUTH_EXPIRED,
    };
  }
}

export class GoogleQuotaExceededError extends TooManyRequests {
  constructor(
    message = 'Google Calendar quota exceeded. Please try again later'
  ) {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: CalendarErrorCode.GOOGLE_QUOTA_EXCEEDED,
    };
  }
}

export class GoogleApiError extends InternalServerError {
  constructor(message = 'Unable to access Google Calendar. Please try again') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: CalendarErrorCode.GOOGLE_API_ERROR,
    };
  }
}

export class CalendarAccessDeniedError extends Forbidden {
  constructor(
    message = 'Unable to access Google Calendar. Please check your permissions'
  ) {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: CalendarErrorCode.CALENDAR_ACCESS_DENIED,
    };
  }
}

export class ConflictError extends Conflict {
  constructor(message = 'Resource conflict') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.INVALID_INPUT,
    };
  }
}

export class UnknownError extends InternalServerError {
  constructor(message = 'An unexpected error occurred. Please try again') {
    super(message);
    this.body = {
      success: false,
      error: message,
      errorCode: AuthErrorCode.UNKNOWN_ERROR,
    };
  }
}
