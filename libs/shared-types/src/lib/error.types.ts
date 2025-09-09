export enum CalendarErrorCode {
  NO_GOOGLE_TOKENS = 'NO_GOOGLE_TOKENS',
  GOOGLE_AUTH_EXPIRED = 'GOOGLE_AUTH_EXPIRED',
  GOOGLE_QUOTA_EXCEEDED = 'GOOGLE_QUOTA_EXCEEDED',
  GOOGLE_API_ERROR = 'GOOGLE_API_ERROR',
  CALENDAR_ACCESS_DENIED = 'CALENDAR_ACCESS_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface CalendarErrorResponse {
  success: false;
  error: string;
  code?: CalendarErrorCode;
  statusCode?: number;
}
