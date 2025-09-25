import { AxiosResponse } from 'axios';
import {
  ProviderType,
  UserIntegration,
  ApiResponse,
} from '@ht-cal-01/shared-types';
import { apiClient, handleApiResponse } from './client';

export class IntegrationsService {
  async getConnectedProviders(): Promise<UserIntegration[]> {
    const response: AxiosResponse<ApiResponse<UserIntegration[]>> =
      await apiClient.get('/api/integrations/providers');
    return handleApiResponse(response);
  }

  async getProviderConfigs(): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await apiClient.get(
      '/api/integrations/providers/configs'
    );
    return handleApiResponse(response);
  }

  async connectProvider(
    providerType: ProviderType,
    authData: any
  ): Promise<{ jobId: string }> {
    const response: AxiosResponse<ApiResponse<{ jobId: string }>> =
      await apiClient.post(
        `/api/integrations/providers/${providerType}/connect`,
        authData
      );
    return handleApiResponse(response);
  }

  async disconnectProvider(providerType: ProviderType): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await apiClient.delete(
      `/api/integrations/providers/${providerType}/disconnect`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to disconnect provider');
    }
  }

  async getProviderStatus(
    providerType: ProviderType
  ): Promise<{ connected: boolean }> {
    const response: AxiosResponse<ApiResponse<{ connected: boolean }>> =
      await apiClient.get(`/api/integrations/providers/${providerType}/status`);
    return handleApiResponse(response);
  }

  async getAvailability(request: {
    dateRange: { start: string; end: string };
    duration: number;
    providerTypes?: ProviderType[];
  }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.post(
      '/api/integrations/availability',
      request
    );
    return handleApiResponse(response);
  }

  async startSync(dateRange?: { start: string; end: string }): Promise<{
    jobId: string;
    status: string;
  }> {
    const response: AxiosResponse<ApiResponse<{ jobId: string }>> =
      await apiClient.post('/api/integrations/sync', { dateRange });
    const result = handleApiResponse(response);
    return {
      jobId: result.jobId,
      status: 'pending',
    };
  }
}

export const integrationsService = new IntegrationsService();
