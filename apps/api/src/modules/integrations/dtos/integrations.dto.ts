import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';

export class ConnectProviderDto {
  @ApiProperty({ description: 'OAuth authorization code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ProviderStatusDto {
  @ApiProperty({ description: 'Whether provider is connected' })
  @IsBoolean()
  connected: boolean;

  @ApiProperty({ description: 'Provider type' })
  @IsString()
  providerType: string;

  @ApiProperty({ description: 'Last sync timestamp', required: false })
  @IsOptional()
  @IsDateString()
  lastSyncAt?: Date;

  @ApiProperty({ description: 'Whether provider is active' })
  @IsBoolean()
  isActive: boolean;
}

export class ProviderConfigDto {
  @ApiProperty({ description: 'Provider type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Provider name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'OAuth scopes' })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiProperty({ description: 'OAuth authorization URL' })
  @IsString()
  authUrl: string;
}

export class SyncCalendarDto {
  @ApiProperty({ description: 'Provider type to sync with' })
  @IsString()
  @IsNotEmpty()
  providerType: string;
}

export class AuthUrlResponseDto {
  @ApiProperty({ description: 'OAuth authorization URL' })
  @IsString()
  authUrl: string;
}
