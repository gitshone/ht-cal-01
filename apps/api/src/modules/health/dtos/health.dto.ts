import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber } from 'class-validator';

export class HealthStatusDto {
  @ApiProperty({ description: 'Overall health status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Application uptime in seconds' })
  @IsNumber()
  uptime: number;

  @ApiProperty({ description: 'Database connection status' })
  @IsBoolean()
  database: boolean;

  @ApiProperty({ description: 'Redis connection status' })
  @IsBoolean()
  redis: boolean;

  @ApiProperty({ description: 'Queue status' })
  @IsBoolean()
  queue: boolean;

  @ApiProperty({ description: 'S3Client connection status' })
  @IsBoolean()
  s3Client: boolean;

  @ApiProperty({ description: 'Timestamp of health check' })
  @IsString()
  timestamp: string;
}
