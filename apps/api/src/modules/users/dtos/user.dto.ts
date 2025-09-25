import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User handle for public booking URLs',
    required: false,
  })
  @IsOptional()
  @IsString()
  handle?: string;
}

export class UpdateUserDto {
  @ApiProperty({ description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'User handle for public booking URLs',
    required: false,
  })
  @IsOptional()
  @IsString()
  handle?: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({
    description: 'User handle for public booking URLs',
    required: false,
  })
  handle?: string;

  @ApiProperty({ description: 'When handle was last updated', required: false })
  handleUpdatedAt?: Date;

  @ApiProperty({ description: 'When user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When user was last updated' })
  updatedAt: Date;
}
