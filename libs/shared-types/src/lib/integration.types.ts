// Integration and Provider Types
export type ProviderType = 'google' | 'microsoft' | 'zoom';

export interface UserIntegration {
  id: string;
  userId: string;
  providerType: ProviderType;
  providerId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date | null;
}

// Extended event DTOs for multi-provider support
export interface CreateEventWithProviderDto {
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  timezone?: string; // IANA timezone string
  providerType: ProviderType;
  meetingType?: 'video_call' | 'phone_call' | 'in_person';
  description?: string;
  meetingUrl?: string;
  location?: string;
  attendees?: string[];
}
