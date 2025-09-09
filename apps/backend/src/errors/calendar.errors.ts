export enum CalendarErrorCode {
  NO_GOOGLE_TOKENS = 'NO_GOOGLE_TOKENS',
  GOOGLE_AUTH_EXPIRED = 'GOOGLE_AUTH_EXPIRED',
  GOOGLE_QUOTA_EXCEEDED = 'GOOGLE_QUOTA_EXCEEDED',
  GOOGLE_API_ERROR = 'GOOGLE_API_ERROR',
  CALENDAR_ACCESS_DENIED = 'CALENDAR_ACCESS_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class CalendarError extends Error {
  public readonly code: CalendarErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;

  constructor(
    code: CalendarErrorCode,
    message: string,
    statusCode: number,
    userMessage: string
  ) {
    super(message);
    this.name = 'CalendarError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
  }

  static noGoogleTokens(): CalendarError {
    return new CalendarError(
      CalendarErrorCode.NO_GOOGLE_TOKENS,
      'No Google tokens found for user',
      403,
      'Google Calendar not connected. Please connect your calendar to view events.'
    );
  }

  static googleAuthExpired(): CalendarError {
    return new CalendarError(
      CalendarErrorCode.GOOGLE_AUTH_EXPIRED,
      'Google Calendar access expired',
      401,
      'Google Calendar access expired. Please reconnect your calendar.'
    );
  }

  static googleQuotaExceeded(): CalendarError {
    return new CalendarError(
      CalendarErrorCode.GOOGLE_QUOTA_EXCEEDED,
      'Google Calendar quota exceeded',
      429,
      'Google Calendar quota exceeded. Please try again later.'
    );
  }

  static googleApiError(message: string): CalendarError {
    return new CalendarError(
      CalendarErrorCode.GOOGLE_API_ERROR,
      `Google API error: ${message}`,
      400,
      'Unable to access Google Calendar. Please try again later.'
    );
  }

  static calendarAccessDenied(): CalendarError {
    return new CalendarError(
      CalendarErrorCode.CALENDAR_ACCESS_DENIED,
      'Calendar access denied',
      403,
      'Access to Google Calendar was denied. Please reconnect your calendar.'
    );
  }

  static unknownError(message: string): CalendarError {
    return new CalendarError(
      CalendarErrorCode.UNKNOWN_ERROR,
      message,
      500,
      'Failed to fetch calendar events. Please try again.'
    );
  }
}
