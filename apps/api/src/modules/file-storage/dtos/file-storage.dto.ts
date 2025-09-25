import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class UploadResultDto {
  @ApiProperty({ description: 'File key in storage' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Public URL to access the file' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'URL expiration date' })
  @IsDateString()
  expiresAt: Date;
}

export class FileUrlResponseDto {
  @ApiProperty({ description: 'File URL' })
  @IsString()
  @IsNotEmpty()
  url: string;
}
