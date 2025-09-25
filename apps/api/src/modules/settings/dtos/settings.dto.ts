import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsObject,
  ValidateNested,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHoursDto {
  @ApiProperty({ description: 'Start time in HH:MM format', example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format.',
  })
  start!: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '17:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format.',
  })
  end!: string;
}

export class DefaultWorkingHoursDto {
  @ApiProperty({
    description: 'Monday working hours',
    required: false,
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  monday?: WorkingHoursDto;

  @ApiProperty({
    description: 'Tuesday working hours',
    required: false,
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  tuesday?: WorkingHoursDto;

  @ApiProperty({
    description: 'Wednesday working hours',
    required: false,
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  wednesday?: WorkingHoursDto;

  @ApiProperty({
    description: 'Thursday working hours',
    required: false,
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  thursday?: WorkingHoursDto;

  @ApiProperty({
    description: 'Friday working hours',
    required: false,
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  friday?: WorkingHoursDto;

  @ApiProperty({
    description: 'Saturday working hours',
    required: false,
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  saturday?: WorkingHoursDto;

  @ApiProperty({
    description: 'Sunday working hours',
    required: false,
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  sunday?: WorkingHoursDto;
}

export class UpdateUserSettingsDto {
  @ApiProperty({
    description: 'Default working hours for each day',
    required: false,
    type: DefaultWorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DefaultWorkingHoursDto)
  defaultWorkingHours?: DefaultWorkingHoursDto;

  @ApiProperty({
    description: 'User timezone',
    required: false,
    example: 'UTC',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiProperty({
    description: 'Invite title for booking pages',
    required: false,
    example: 'Book a meeting with me',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  inviteTitle?: string;

  @ApiProperty({
    description: 'Invite description for booking pages',
    required: false,
    example: 'Schedule a meeting at your convenience',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  inviteDescription?: string;

  @ApiProperty({ description: 'Invite logo URL', required: false })
  @IsOptional()
  @IsString()
  inviteLogoUrl?: string | null;

  @ApiProperty({ description: 'Invite logo key in storage', required: false })
  @IsOptional()
  @IsString()
  inviteLogoKey?: string | null;

  @ApiProperty({
    description: 'Available meeting durations in minutes',
    required: false,
    example: [15, 30, 60],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsIn([15, 30, 45, 60, 90, 120], {
    each: true,
    message:
      'Invalid duration. Valid durations are: 15, 30, 45, 60, 90, 120 minutes',
  })
  availableDurations?: number[];

  @ApiProperty({
    description: 'Whether user accepts new meetings',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  acceptsNewMeetings?: boolean;
}

export class UserSettingsResponseDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'Default working hours for each day',
    type: DefaultWorkingHoursDto,
  })
  @IsObject()
  defaultWorkingHours!: DefaultWorkingHoursDto;

  @ApiProperty({ description: 'User timezone', example: 'UTC' })
  @IsString()
  timezone!: string;

  @ApiProperty({
    description: 'Invite title for booking pages',
    required: false,
  })
  @IsOptional()
  @IsString()
  inviteTitle?: string;

  @ApiProperty({
    description: 'Invite description for booking pages',
    required: false,
  })
  @IsOptional()
  @IsString()
  inviteDescription?: string;

  @ApiProperty({ description: 'Invite logo URL', required: false })
  @IsOptional()
  @IsString()
  inviteLogoUrl?: string;

  @ApiProperty({ description: 'Invite logo key in storage', required: false })
  @IsOptional()
  @IsString()
  inviteLogoKey?: string;

  @ApiProperty({
    description: 'Available meeting durations in minutes',
    example: [15, 30, 60],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  availableDurations!: number[];

  @ApiProperty({
    description: 'Whether user accepts new meetings',
    example: true,
  })
  @IsBoolean()
  acceptsNewMeetings!: boolean;

  @ApiProperty({ description: 'Settings creation timestamp' })
  @IsString()
  createdAt!: Date;

  @ApiProperty({ description: 'Settings last update timestamp' })
  @IsString()
  updatedAt!: Date;
}

export class CreateUnavailabilityBlockDto {
  @ApiProperty({ description: 'Block title', example: 'Lunch Break' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '12:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format.',
  })
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '13:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format.',
  })
  endTime!: string;

  @ApiProperty({
    description: 'Days of the week when this block applies',
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    enum: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsIn(
    [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
    { each: true }
  )
  days!: string[];
}

export class UpdateUnavailabilityBlockDto {
  @ApiProperty({
    description: 'Block title',
    required: false,
    example: 'Lunch Break',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    description: 'Start time in HH:MM format',
    required: false,
    example: '12:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format.',
  })
  startTime?: string;

  @ApiProperty({
    description: 'End time in HH:MM format',
    required: false,
    example: '13:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format.',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Days of the week when this block applies',
    required: false,
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    enum: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(
    [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
    { each: true }
  )
  days?: string[];
}

export class UnavailabilityBlockResponseDto {
  @ApiProperty({ description: 'Block ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Block title', example: 'Lunch Break' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '12:00' })
  @IsString()
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '13:00' })
  @IsString()
  endTime!: string;

  @ApiProperty({
    description: 'Days of the week when this block applies',
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  })
  @IsArray()
  @IsString({ each: true })
  days!: string[];

  @ApiProperty({ description: 'Block creation timestamp' })
  @IsString()
  createdAt!: Date;

  @ApiProperty({ description: 'Block last update timestamp' })
  @IsString()
  updatedAt!: Date;
}
