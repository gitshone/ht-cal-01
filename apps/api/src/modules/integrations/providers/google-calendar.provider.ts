import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { AppConfigService } from '../../../core/config/app-config.service';
import { UserIntegrationsRepository } from '../repositories/user-integrations.repository';
import { CreateEventDto, UpdateEventDto } from '../../events/dtos/event.dto';

export interface ExternalEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  description?: string;
  location?: string;
  attendees?: string[];
  meetingUrl?: string;
  meetingType?: string;
  providerType: string;
  externalEventId: string;
}

@Injectable()
export class GoogleCalendarProvider {
  private static readonly GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  private static readonly DEFAULT_REMINDERS = {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 },
      { method: 'popup', minutes: 30 },
    ],
  };

  constructor(
    private userIntegrationsRepository: UserIntegrationsRepository,
    config: AppConfigService
  ) {
    this.config = config;
  }

  private config: AppConfigService;

  async connect(userId: string, authData: { code: string }): Promise<void> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.config.googleClientId,
        this.config.googleClientSecret,
        'postmessage' // Use 'postmessage' for server-side OAuth flows
      );

      const { tokens } = await oauth2Client.getToken(authData.code);

      // Ensure we have the required tokens
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Invalid token response from Google');
      }

      // Store integration directly without getting user info first
      await this.userIntegrationsRepository.create({
        userId,
        providerType: 'google',
        providerId: userId, // Use userId as providerId for now
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
        scope: GoogleCalendarProvider.GOOGLE_SCOPES,
      });

      console.log(`Google Calendar connected for user: ${userId}`);
    } catch (error) {
      console.error('Failed to connect Google Calendar', error);
      throw new Error('Failed to connect Google Calendar');
    }
  }

  async disconnect(userId: string): Promise<void> {
    try {
      await this.userIntegrationsRepository.deleteByUserIdAndProvider(
        userId,
        'google'
      );
      console.log(`Google Calendar disconnected for user: ${userId}`);
    } catch (error) {
      console.error('Failed to disconnect Google Calendar', error);
      throw new Error('Failed to disconnect Google Calendar');
    }
  }

  async createEvent(
    userId: string,
    eventData: CreateEventDto
  ): Promise<ExternalEvent> {
    try {
      this.validateEventData(eventData);

      const calendar = await this.getCalendarClient(userId);
      const requestBody = this.buildEventRequestBody(eventData);

      const googleEvent = await calendar.events.insert({
        calendarId: 'primary',
        requestBody,
      });

      const externalEvent = this.normalizeExternalEvent(googleEvent.data);
      console.log(`Event created successfully for user: ${userId}`, {
        eventId: externalEvent.id,
      });

      return externalEvent;
    } catch (error) {
      console.error('Failed to create event', error);
      throw new Error('Failed to create event');
    }
  }

  async updateEvent(
    userId: string,
    eventId: string,
    eventData: UpdateEventDto
  ): Promise<ExternalEvent> {
    try {
      const calendar = await this.getCalendarClient(userId);
      const requestBody = this.buildEventRequestBody(eventData);

      const googleEvent = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody,
      });

      const externalEvent = this.normalizeExternalEvent(googleEvent.data);
      console.log(`Event updated successfully for user: ${userId}`, {
        eventId: externalEvent.id,
      });

      return externalEvent;
    } catch (error) {
      console.error('Failed to update event', error);
      throw new Error('Failed to update event');
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    try {
      const calendar = await this.getCalendarClient(userId);

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      console.log(`Event deleted successfully for user: ${userId}`, {
        eventId,
      });
    } catch (error) {
      console.error('Failed to delete event', error);
      throw new Error('Failed to delete event');
    }
  }

  async getEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExternalEvent[]> {
    try {
      const calendar = await this.getCalendarClient(userId);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      return events.map(event => this.normalizeExternalEvent(event));
    } catch (error) {
      console.error('Failed to get events', error);
      throw new Error('Failed to get events');
    }
  }

  async getAuthUrl(): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      this.config.googleClientId,
      this.config.googleClientSecret,
      'postmessage' // Use 'postmessage' for server-side OAuth flows
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GoogleCalendarProvider.GOOGLE_SCOPES,
      prompt: 'consent',
    });
  }

  private async getCalendarClient(userId: string) {
    const integration =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        'google'
      );

    if (!integration) {
      throw new Error('Google Calendar not connected');
    }

    const oauth2Client = new google.auth.OAuth2(
      this.config.googleClientId,
      this.config.googleClientSecret,
      'postmessage' // Use 'postmessage' for server-side OAuth flows
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.expiresAt?.getTime(),
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  private buildEventRequestBody(eventData: CreateEventDto | UpdateEventDto) {
    const requestBody: any = {
      summary: eventData.title,
      reminders: GoogleCalendarProvider.DEFAULT_REMINDERS,
    };

    if (eventData.startDate && eventData.endDate) {
      if (eventData.isAllDay) {
        requestBody.start = {
          date: eventData.startDate,
        };
        requestBody.end = {
          date: eventData.endDate,
        };
      } else {
        requestBody.start = {
          dateTime: eventData.startDate,
        };
        requestBody.end = {
          dateTime: eventData.endDate,
        };
      }
    }

    if (eventData.description) {
      requestBody.description = eventData.description;
    }

    if (eventData.location) {
      requestBody.location = eventData.location;
    }

    if (eventData.attendees && eventData.attendees.length > 0) {
      requestBody.attendees = eventData.attendees.map(email => ({ email }));
    }

    if (eventData.meetingUrl) {
      requestBody.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    return requestBody;
  }

  private normalizeExternalEvent(googleEvent: any): ExternalEvent {
    const start = googleEvent.start?.dateTime || googleEvent.start?.date;
    const end = googleEvent.end?.dateTime || googleEvent.end?.date;
    const isAllDay = !!googleEvent.start?.date;

    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      startDate: new Date(start),
      endDate: new Date(end),
      isAllDay,
      description: googleEvent.description,
      location: googleEvent.location,
      attendees: googleEvent.attendees?.map((a: any) => a.email),
      meetingUrl: googleEvent.conferenceData?.entryPoints?.[0]?.uri,
      meetingType: googleEvent.conferenceData ? 'video_call' : undefined,
      providerType: 'google',
      externalEventId: googleEvent.id,
    };
  }

  private validateEventData(eventData: CreateEventDto | UpdateEventDto): void {
    if (eventData.title && eventData.title.trim().length === 0) {
      throw new Error('Event title cannot be empty');
    }

    if (
      eventData.startDate &&
      eventData.endDate &&
      eventData.startDate >= eventData.endDate
    ) {
      throw new Error('Start date must be before end date');
    }
  }

  getConfig() {
    return {
      type: 'google',
      name: 'Google Calendar',
      scopes: GoogleCalendarProvider.GOOGLE_SCOPES,
      authUrl: this.getAuthUrl(),
    };
  }
}
