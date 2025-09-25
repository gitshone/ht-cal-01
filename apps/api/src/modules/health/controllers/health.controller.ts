import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';
import { HealthStatusDto } from '../dtos/health.dto';
import { Public } from '../../../shared/decorators';
import { ApiResponseDto } from '../../../shared/dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
    type: HealthStatusDto,
  })
  async getHealth(): Promise<ApiResponseDto<HealthStatusDto>> {
    const healthStatus = await this.healthService.getHealthStatus();
    return ApiResponseDto.success(
      'Health status retrieved successfully',
      healthStatus
    );
  }

  @Public()
  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear application cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(): Promise<ApiResponseDto> {
    await this.healthService.clearCache();
    return ApiResponseDto.success('Cache cleared successfully');
  }
}
