// Database Event model
export interface Event {
  id: string;
  userId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  status: string; // Allow any string from database, validate in DTOs
  providerType?: string | null;
  externalEventId?: string | null;
  meetingUrl?: string | null;
  meetingType?: string | null;
  description?: string | null;
  location?: string | null;
  timezone?: string | null;
  attendees?: string[] | null; // Array of email addresses for video call participants
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date | null;
}

// Event creation/update DTOs
export interface CreateEventDto {
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  timezone?: string; // IANA timezone string
  providerType?: 'google' | 'microsoft' | 'zoom';
  meetingType?: 'video_call' | 'phone_call' | 'in_person';
  meetingUrl?: string;
  description?: string;
  location?: string;
  attendees?: string[]; // Array of email addresses for video call participants
}

export interface UpdateEventDto {
  title?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  timezone?: string; // IANA timezone string
  status?: 'confirmed' | 'tentative' | 'cancelled';
  meetingType?: 'video_call' | 'phone_call' | 'in_person';
  meetingUrl?: string;
  description?: string;
  location?: string;
  attendees?: string[]; // Array of email addresses for video call participants
}

// Simplified event filtering (Google Calendar-like)
export type CalendarViewType = 'day' | 'week' | 'month' | 'year';
export type EventFilterType = 'all' | 'google' | 'microsoft' | 'zoom';

// Simplified response for events API
export interface EventResponse {
  events: Event[];
  dateRange: {
    start: string;
    end: string;
  };
  viewType: CalendarViewType;
  totalCount: number;
}

