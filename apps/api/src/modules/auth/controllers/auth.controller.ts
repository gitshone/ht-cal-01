import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { Public } from '../../../shared/decorators';
import {
  FirebaseLoginDto,
  RefreshTokenDto,
  LogoutDto,
  LoginResponseDto,
  UpdateHandleDto,
  UserProfileDto,
} from '../dtos/auth.dto';
import { ApiResponseDto } from '../../../shared/dto';
import { SentryOperation } from '../../../core/decorators/sentry-operation.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('firebase-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Firebase ID token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })
  async firebaseLogin(
    @Body() loginDto: FirebaseLoginDto
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const result = await this.authService.firebaseLogin(loginDto);
    return ApiResponseDto.success('Login successful', result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshDto: RefreshTokenDto
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const result = await this.authService.refreshTokens(refreshDto);
    return ApiResponseDto.success('Token refreshed successfully', result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() req: any,
    @Body() logoutDto: LogoutDto
  ): Promise<ApiResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token, logoutDto.refreshToken);
    return ApiResponseDto.success('Logout successful');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @SentryOperation({
    operation: 'read',
    category: 'api',
    description: 'Getting user profile',
    trackSuccess: false,
  })
  async getProfile(@Req() req: any): Promise<ApiResponseDto> {
    const user = await this.authService.getUserById(req.user.userId);

    return ApiResponseDto.success('Profile retrieved successfully', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      handle: user.handle,
      handleUpdatedAt: user.handleUpdatedAt?.toISOString() || null,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('handle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user handle' })
  @ApiResponse({ status: 200, description: 'Handle updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid handle or handle already exists',
  })
  async updateHandle(
    @Req() req: any,
    @Body() updateHandleDto: UpdateHandleDto
  ): Promise<ApiResponseDto> {
    await this.authService.updateHandle(
      req.user.userId,
      updateHandleDto.handle
    );
    return ApiResponseDto.success('Handle updated successfully');
  }
}
