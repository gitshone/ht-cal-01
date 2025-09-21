export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  handle?: string; // Unique handle for public booking URLs
  handleUpdatedAt?: Date; // When handle was last changed
  createdAt: Date;
  updatedAt: Date;
  hasEvents?: boolean; // Optional for backward compatibility
  settings?: UserSettings; // Optional settings
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export interface UpdateUserHandleDto {
  handle: string;
}

// Settings Types
export interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface DefaultWorkingHours {
  monday?: WorkingHours;
  tuesday?: WorkingHours;
  wednesday?: WorkingHours;
  thursday?: WorkingHours;
  friday?: WorkingHours;
  saturday?: WorkingHours;
  sunday?: WorkingHours;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultWorkingHours?: DefaultWorkingHours;
  timezone: string;
  inviteTitle?: string;
  inviteDescription?: string;
  inviteLogoUrl?: string;
  inviteLogoKey?: string; // S3 key for the logo file
  availableDurations: number[]; // Available meeting durations in minutes
  acceptsNewMeetings: boolean; // Whether user accepts new meeting requests
  createdAt: Date;
  updatedAt: Date;
  unavailabilityBlocks?: UnavailabilityBlock[];
}

export interface UnavailabilityBlock {
  id: string;
  userId: string;
  title: string;
  startTime: string; // "12:00"
  endTime: string;   // "13:00"
  days: string[];     // ["monday", "tuesday", ...]
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserSettingsDto {
  defaultWorkingHours?: DefaultWorkingHours;
  timezone?: string;
  inviteTitle?: string;
  inviteDescription?: string;
  inviteLogoUrl?: string;
  inviteLogoKey?: string;
  availableDurations?: number[];
  acceptsNewMeetings?: boolean;
}

export interface UpdateUserSettingsDto {
  defaultWorkingHours?: DefaultWorkingHours;
  timezone?: string;
  inviteTitle?: string;
  inviteDescription?: string;
  inviteLogoUrl?: string | null;
  inviteLogoKey?: string | null;
  availableDurations?: number[];
  acceptsNewMeetings?: boolean;
}

export interface CreateUnavailabilityBlockDto {
  title: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface UpdateUnavailabilityBlockDto {
  title?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
}
