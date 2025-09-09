export interface CalendarEvent {
  id: string;
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // ISO time string (HH:MM:SS)
  endTime: string; // ISO time string (HH:MM:SS)
  isAllDay: boolean;
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

// Google Calendar API types for backend use
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
