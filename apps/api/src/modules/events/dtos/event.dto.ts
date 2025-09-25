import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsISO8601,
  Matches,
} from 'class-validator';

export enum CalendarViewType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum EventFilterType {
  ALL = 'all',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  ZOOM = 'zoom',
}

export class GetEventsQueryDto {
  @ApiProperty({
    description: 'Calendar view type',
    enum: CalendarViewType,
    default: CalendarViewType.WEEK,
  })
  @IsEnum(CalendarViewType)
  viewType!: CalendarViewType;

  @ApiProperty({ description: 'Start date for events range' })
  @IsISO8601({ strict: false })
  startDate!: string;

  @ApiProperty({ description: 'End date for events range' })
  @IsISO8601({ strict: false })
  endDate!: string;

  @ApiProperty({
    description: 'Provider filter',
    enum: EventFilterType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventFilterType)
  providerFilter?: EventFilterType;

  @ApiProperty({ description: 'Search query for events', required: false })
  @IsOptional()
  @IsString()
  searchQuery?: string;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @Matches(/^\S+/, {
    message: 'title must contain at least one non-whitespace character',
  })
  title: string;

  @ApiProperty({ description: 'Event start date' })
  @IsISO8601({ strict: false })
  startDate: string;

  @ApiProperty({ description: 'Event end date' })
  @IsISO8601({ strict: false })
  endDate: string;

  @ApiProperty({ description: 'Whether event is all day', default: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ description: 'Event status', default: 'confirmed' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Provider type', default: 'google' })
  @IsOptional()
  @IsString()
  providerType?: string;

  @ApiProperty({
    description: 'External event ID from provider',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalEventId?: string;

  @ApiProperty({ description: 'Meeting URL', required: false })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiProperty({ description: 'Meeting type', required: false })
  @IsOptional()
  @IsString()
  meetingType?: string;

  @ApiProperty({ description: 'Event description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Event location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Event timezone', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'Event attendees', required: false })
  @IsOptional()
  @IsArray()
  attendees?: string[];
}

export class UpdateEventDto {
  @ApiProperty({ description: 'Event title', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\S+/, {
    message: 'title must contain at least one non-whitespace character',
  })
  title?: string;

  @ApiProperty({ description: 'Event start date', required: false })
  @IsOptional()
  @IsISO8601({ strict: false })
  startDate?: string;

  @ApiProperty({ description: 'Event end date', required: false })
  @IsOptional()
  @IsISO8601({ strict: false })
  endDate?: string;

  @ApiProperty({ description: 'Whether event is all day', required: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ description: 'Event status', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Meeting URL', required: false })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiProperty({ description: 'Meeting type', required: false })
  @IsOptional()
  @IsString()
  meetingType?: string;

  @ApiProperty({ description: 'Event description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Event location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Event timezone', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'Event attendees', required: false })
  @IsOptional()
  @IsArray()
  attendees?: string[];
}

export class EventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'User ID who owns the event' })
  userId: string;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event start date' })
  startDate: Date;

  @ApiProperty({ description: 'Event end date' })
  endDate: Date;

  @ApiProperty({ description: 'Whether event is all day' })
  isAllDay: boolean;

  @ApiProperty({ description: 'Event status' })
  status: string;

  @ApiProperty({ description: 'Provider type' })
  providerType: string;

  @ApiProperty({
    description: 'External event ID from provider',
    required: false,
  })
  externalEventId?: string;

  @ApiProperty({ description: 'Meeting URL', required: false })
  meetingUrl?: string;

  @ApiProperty({ description: 'Meeting type', required: false })
  meetingType?: string;

  @ApiProperty({ description: 'Event description', required: false })
  description?: string;

  @ApiProperty({ description: 'Event location', required: false })
  location?: string;

  @ApiProperty({ description: 'Event timezone', required: false })
  timezone?: string;

  @ApiProperty({ description: 'Event attendees', required: false })
  attendees?: string[];

  @ApiProperty({ description: 'When event was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When event was last updated' })
  updatedAt: Date;

  @ApiProperty({ description: 'When event was last synced', required: false })
  syncedAt?: Date;
}

export class EventRangeQueryDto {
  @ApiProperty({ description: 'Start date for range query' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for range query' })
  @IsDateString()
  endDate: string;
}
