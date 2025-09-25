import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase ID token' })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate', required: false })
  @IsString()
  refreshToken?: string;
}

export class UpdateHandleDto {
  @ApiProperty({
    description:
      'New user handle (3-30 characters, alphanumeric + underscore/hyphen)',
  })
  @IsString()
  @IsNotEmpty()
  handle!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken!: string;

  @ApiProperty({ description: 'User information' })
  user!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    handle?: string;
  };
}

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email address' })
  email!: string;

  @ApiProperty({ description: 'User first name' })
  firstName!: string;

  @ApiProperty({ description: 'User last name' })
  lastName!: string;

  @ApiProperty({
    description:
      'User handle for public booking URLs (e.g., youtube.com/handle)',
    required: false,
    nullable: true,
  })
  handle?: string | null;

  @ApiProperty({
    description: 'Timestamp when the handle was last updated',
    required: false,
    nullable: true,
    type: 'string',
    format: 'date-time',
  })
  handleUpdatedAt?: string | null;
}
