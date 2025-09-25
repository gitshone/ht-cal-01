import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { IntegrationsService } from '../services/integrations.service';
import {
  ConnectProviderDto,
  ProviderStatusDto,
  ProviderConfigDto,
  AuthUrlResponseDto,
} from '../dtos/integrations.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { ApiResponseDto } from '../../../shared/dto';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get connected providers for current user' })
  @ApiResponse({
    status: 200,
    description: 'Connected providers retrieved successfully',
    type: [ProviderStatusDto],
  })
  async getConnectedProviders(
    @Req() req: any
  ): Promise<ApiResponseDto<ProviderStatusDto[]>> {
    const providers = await this.integrationsService.getConnectedProviders(
      req.user.userId
    );
    return ApiResponseDto.success(
      'Connected providers retrieved successfully',
      providers
    );
  }

  @Get('providers/configs')
  @ApiOperation({ summary: 'Get all available provider configurations' })
  @ApiResponse({
    status: 200,
    description: 'Provider configurations retrieved successfully',
    type: [ProviderConfigDto],
  })
  async getProviderConfigs(): Promise<ApiResponseDto<ProviderConfigDto[]>> {
    const configs = await this.integrationsService.getProviderConfigs();
    return ApiResponseDto.success(
      'Provider configurations retrieved successfully',
      configs
    );
  }

  @Post('providers/:providerType/connect')
  @ApiOperation({ summary: 'Connect a calendar provider' })
  @ApiParam({
    name: 'providerType',
    description: 'Provider type (google, microsoft, zoom)',
  })
  @ApiResponse({ status: 201, description: 'Provider connected successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid provider or already connected',
  })
  async connectProvider(
    @Req() req: any,
    @Param('providerType') providerType: string,
    @Body() connectDto: ConnectProviderDto
  ): Promise<ApiResponseDto> {
    await this.integrationsService.connectProvider(
      req.user.userId,
      providerType,
      connectDto
    );
    return ApiResponseDto.success('Provider connected successfully');
  }

  @Delete('providers/:providerType/disconnect')
  @ApiOperation({ summary: 'Disconnect a calendar provider' })
  @ApiParam({
    name: 'providerType',
    description: 'Provider type (google, microsoft, zoom)',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider disconnected successfully',
  })
  @ApiResponse({ status: 404, description: 'Provider not connected' })
  async disconnectProvider(
    @Req() req: any,
    @Param('providerType') providerType: string
  ): Promise<ApiResponseDto> {
    await this.integrationsService.disconnectProvider(
      req.user.userId,
      providerType
    );
    return ApiResponseDto.success('Provider disconnected successfully');
  }

  @Get('providers/:providerType/status')
  @ApiOperation({ summary: 'Get provider connection status' })
  @ApiParam({
    name: 'providerType',
    description: 'Provider type (google, microsoft, zoom)',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider status retrieved successfully',
    type: ProviderStatusDto,
  })
  async getProviderStatus(
    @Req() req: any,
    @Param('providerType') providerType: string
  ): Promise<ApiResponseDto<ProviderStatusDto>> {
    const status = await this.integrationsService.getProviderStatus(
      req.user.userId,
      providerType
    );
    return ApiResponseDto.success(
      'Provider status retrieved successfully',
      status
    );
  }

  @Post('providers/:providerType/sync')
  @ApiOperation({ summary: 'Sync calendar with provider' })
  @ApiParam({
    name: 'providerType',
    description: 'Provider type (google, microsoft, zoom)',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar sync started successfully',
  })
  @ApiResponse({ status: 404, description: 'Provider not connected' })
  async syncCalendar(
    @Req() req: any,
    @Param('providerType') providerType: string
  ): Promise<ApiResponseDto> {
    await this.integrationsService.syncCalendar(req.user.userId, providerType);
    return ApiResponseDto.success('Calendar sync started successfully');
  }

  @Get('providers/:providerType/auth-url')
  @ApiOperation({ summary: 'Get OAuth authorization URL for provider' })
  @ApiParam({
    name: 'providerType',
    description: 'Provider type (google, microsoft, zoom)',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL retrieved successfully',
  })
  async getAuthUrl(
    @Param('providerType') providerType: string
  ): Promise<ApiResponseDto<AuthUrlResponseDto>> {
    const authUrl = await this.integrationsService.getAuthUrl(providerType);
    return ApiResponseDto.success('Authorization URL retrieved successfully', {
      authUrl,
    });
  }
}
