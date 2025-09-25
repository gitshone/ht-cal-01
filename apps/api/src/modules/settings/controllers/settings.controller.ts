import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from '../services/settings.service';
import {
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
  UserSettingsResponseDto,
  UnavailabilityBlockResponseDto,
} from '../dtos/settings.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { ApiResponseDto } from '../../../shared/dto';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({
    status: 200,
    description: 'User settings retrieved successfully',
    type: UserSettingsResponseDto,
  })
  async getUserSettings(
    @Req() req: any
  ): Promise<ApiResponseDto<UserSettingsResponseDto>> {
    const settings = await this.settingsService.getUserSettings(
      req.user.userId
    );
    return ApiResponseDto.success(
      'User settings retrieved successfully',
      settings
    );
  }

  @Put()
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({
    status: 200,
    description: 'User settings updated successfully',
    type: UserSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid settings data' })
  async updateUserSettings(
    @Req() req: any,
    @Body() updateDto: UpdateUserSettingsDto
  ): Promise<ApiResponseDto<UserSettingsResponseDto>> {
    const settings = await this.settingsService.updateUserSettings(
      req.user.userId,
      updateDto
    );
    return ApiResponseDto.success(
      'User settings updated successfully',
      settings
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete user settings' })
  @ApiResponse({
    status: 200,
    description: 'User settings deleted successfully',
  })
  async deleteUserSettings(@Req() req: any): Promise<ApiResponseDto> {
    await this.settingsService.deleteUserSettings(req.user.userId);
    return ApiResponseDto.success('User settings deleted successfully');
  }

  // Unavailability Blocks endpoints
  @Get('unavailability-blocks')
  @ApiOperation({ summary: 'Get user unavailability blocks' })
  @ApiResponse({
    status: 200,
    description: 'Unavailability blocks retrieved successfully',
    type: [UnavailabilityBlockResponseDto],
  })
  async getUserUnavailabilityBlocks(
    @Req() req: any
  ): Promise<ApiResponseDto<UnavailabilityBlockResponseDto[]>> {
    const blocks = await this.settingsService.getUserUnavailabilityBlocks(
      req.user.userId
    );
    return ApiResponseDto.success(
      'Unavailability blocks retrieved successfully',
      blocks
    );
  }

  @Post('unavailability-blocks')
  @ApiOperation({ summary: 'Create unavailability block' })
  @ApiResponse({
    status: 201,
    description: 'Unavailability block created successfully',
    type: UnavailabilityBlockResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid block data' })
  async createUnavailabilityBlock(
    @Req() req: any,
    @Body() createDto: CreateUnavailabilityBlockDto
  ): Promise<ApiResponseDto<UnavailabilityBlockResponseDto>> {
    const block = await this.settingsService.createUnavailabilityBlock(
      req.user.userId,
      createDto
    );
    return ApiResponseDto.success(
      'Unavailability block created successfully',
      block
    );
  }

  @Put('unavailability-blocks/:id')
  @ApiOperation({ summary: 'Update unavailability block' })
  @ApiParam({ name: 'id', description: 'Unavailability block ID' })
  @ApiResponse({
    status: 200,
    description: 'Unavailability block updated successfully',
    type: UnavailabilityBlockResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid block data' })
  @ApiResponse({ status: 404, description: 'Unavailability block not found' })
  async updateUnavailabilityBlock(
    @Req() req: any,
    @Param('id') blockId: string,
    @Body() updateDto: UpdateUnavailabilityBlockDto
  ): Promise<ApiResponseDto<UnavailabilityBlockResponseDto>> {
    const block = await this.settingsService.updateUnavailabilityBlock(
      blockId,
      req.user.userId,
      updateDto
    );
    return ApiResponseDto.success(
      'Unavailability block updated successfully',
      block
    );
  }

  @Delete('unavailability-blocks/:id')
  @ApiOperation({ summary: 'Delete unavailability block' })
  @ApiParam({ name: 'id', description: 'Unavailability block ID' })
  @ApiResponse({
    status: 200,
    description: 'Unavailability block deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Unavailability block not found' })
  async deleteUnavailabilityBlock(
    @Req() req: any,
    @Param('id') blockId: string
  ): Promise<ApiResponseDto> {
    await this.settingsService.deleteUnavailabilityBlock(
      blockId,
      req.user.userId
    );
    return ApiResponseDto.success('Unavailability block deleted successfully');
  }

  // Logo upload endpoints
  @Post('logo')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Upload user logo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Logo uploaded successfully',
    type: UserSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadLogo(
    @Req() req: any,
    @UploadedFile() file: any
  ): Promise<ApiResponseDto<UserSettingsResponseDto>> {
    if (!file) {
      return ApiResponseDto.error('No file uploaded');
    }

    const settings = await this.settingsService.uploadLogo(
      req.user.userId,
      file
    );
    return ApiResponseDto.success('Logo uploaded successfully', settings);
  }

  @Delete('logo')
  @ApiOperation({ summary: 'Delete user logo' })
  @ApiResponse({
    status: 200,
    description: 'Logo deleted successfully',
    type: UserSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No logo to delete' })
  async deleteLogo(
    @Req() req: any
  ): Promise<ApiResponseDto<UserSettingsResponseDto>> {
    const settings = await this.settingsService.deleteLogo(req.user.userId);
    return ApiResponseDto.success('Logo deleted successfully', settings);
  }
}
