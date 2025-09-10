export interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  startTime: string; 
  endTime: string;
  isAllDay: boolean;
}

// Database Event model
export interface Event {
  id: string;
  userId: string;
  googleId?: string | null;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  googleCalendarId?: string | null;
  googleEventId?: string | null;
  googleHtmlLink?: string | null;
  timezone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date | null;
  displayDate?: string;
}

// Event creation/update DTOs
export interface CreateEventDto {
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
}

export interface UpdateEventDto {
  title?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

// Event filtering and grouping
export interface EventFilterParams {
  startDate?: string;
  endDate?: string;
  dateRange?: '1' | '7' | '30'; // days
  groupBy?: 'day' | 'week';
  limit?: number;
  cursor?: string;
}

export interface GroupedEvents {
  [key: string]: Event[];
}

export interface EventListResponse {
  groupedEvents: GroupedEvents;
  dateRange: {
    start: string;
    end: string;
  };
  groupBy: 'day' | 'week';
  hasNextPage: boolean;
  nextCursor?: string;
  hasPreviousPage: boolean;
  previousCursor?: string;
}

export interface GoogleCalendarEventData {
  id?: string | null;
  summary?: string | null;
  start?: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  } | null;
  end?: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  } | null;
  status?: string | null;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: CalendarAttendee[];
  creator: {
    email: string;
    displayName?: string;
  };
  organizer: {
    email: string;
    displayName?: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  created: string;
  updated: string;
}

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
}

export interface CalendarListResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface CalendarListParams {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  pageToken?: string;
  syncToken?: string;
}

export interface GoogleAuthUrlResponse {
  authUrl: string;
}

export interface GoogleTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleRefreshTokenRequest {
  refreshToken: string;
}

export interface GoogleRefreshTokenResponse {
  accessToken: string;
}

