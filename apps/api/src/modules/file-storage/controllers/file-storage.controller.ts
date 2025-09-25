import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
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
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileStorageService } from '../../../infrastructure/file-storage/file-storage.service';
import { UploadResultDto, FileUrlResponseDto } from '../dtos/file-storage.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { ApiResponseDto } from '../../../shared/dto';

@ApiTags('file-storage')
@Controller('file-storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileStorageController {
  constructor(private readonly fileStorageService: FileStorageService) {}

  @Post('upload/logo')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Upload user logo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Logo uploaded successfully',
    type: UploadResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadLogo(
    @Req() req: any,
    @UploadedFile() file: any
  ): Promise<ApiResponseDto<UploadResultDto>> {
    if (!file) {
      return ApiResponseDto.error('No file uploaded');
    }

    try {
      const result = await this.fileStorageService.uploadLogo(
        req.user.userId,
        file
      );
      return ApiResponseDto.success('Logo uploaded successfully', result);
    } catch (error) {
      return ApiResponseDto.error(
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  }

  @Get('logo/:key')
  @ApiOperation({ summary: 'Get logo URL by key' })
  @ApiResponse({ status: 200, description: 'Logo URL retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Logo not found' })
  async getLogoUrl(
    @Param('key') key: string
  ): Promise<ApiResponseDto<FileUrlResponseDto>> {
    try {
      const url = await this.fileStorageService.getSignedUrl(key);
      return ApiResponseDto.success('Logo URL retrieved successfully', { url });
    } catch (error) {
      console.error('Failed to get logo URL:', error);
      return ApiResponseDto.error('Logo not found');
    }
  }

  @Delete('logo/:key')
  @ApiOperation({ summary: 'Delete logo by key' })
  @ApiResponse({ status: 200, description: 'Logo deleted successfully' })
  @ApiResponse({ status: 500, description: 'Failed to delete logo' })
  async deleteLogo(@Param('key') key: string): Promise<ApiResponseDto> {
    try {
      await this.fileStorageService.deleteFile(key);
      return ApiResponseDto.success('Logo deleted successfully');
    } catch (error) {
      console.error('Failed to delete logo:', error);
      return ApiResponseDto.error('Failed to delete logo');
    }
  }
}
