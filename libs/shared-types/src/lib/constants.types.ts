export const EVENT_CONSTANTS = {
  // Pagination
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,

  // Date ranges
  DATE_RANGES: {
    ONE_DAY: '1',
    ONE_WEEK: '7',
    ONE_MONTH: '30',
  } as const,

  // Grouping
  GROUP_BY: {
    DAY: 'day',
    WEEK: 'week',
  } as const,

  // Sync
  SYNC_MONTHS_BACK: 6,
  SYNC_MONTHS_FORWARD: 6,
  BATCH_SIZE: 100,
  GOOGLE_MAX_RESULTS: 2500,

  // Event validation
  MAX_TITLE_LENGTH: 200,
  MIN_TITLE_LENGTH: 1,

  // Job queue
  JOB_TYPES: {
    SYNC_EVENTS: 'sync_events',
    CONNECT_CALENDAR: 'connect_calendar',
    CLEANUP_BLACKLISTED_TOKENS: 'cleanup_blacklisted_tokens',
  } as const,

  // Status
  EVENT_STATUS: {
    CONFIRMED: 'confirmed',
    TENTATIVE: 'tentative',
    CANCELLED: 'cancelled',
  } as const,
} as const;

export type DateRange =
  (typeof EVENT_CONSTANTS.DATE_RANGES)[keyof typeof EVENT_CONSTANTS.DATE_RANGES];
export type GroupBy =
  (typeof EVENT_CONSTANTS.GROUP_BY)[keyof typeof EVENT_CONSTANTS.GROUP_BY];
export type EventStatus =
  (typeof EVENT_CONSTANTS.EVENT_STATUS)[keyof typeof EVENT_CONSTANTS.EVENT_STATUS];
export type JobType =
  (typeof EVENT_CONSTANTS.JOB_TYPES)[keyof typeof EVENT_CONSTANTS.JOB_TYPES];
