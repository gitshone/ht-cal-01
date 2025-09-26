import { ProviderType, UserIntegration } from '@ht-cal-01/shared-types';
import { apiClient } from './client';

export class IntegrationsService {
  async getConnectedProviders(): Promise<UserIntegration[]> {
    return apiClient.get<UserIntegration[]>('/api/integrations/providers');
  }

  async getProviderConfigs(): Promise<any[]> {
    return apiClient.get<any[]>('/api/integrations/providers/configs');
  }

  async connectProvider(
    providerType: ProviderType,
    authData: any
  ): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>(
      `/api/integrations/providers/${providerType}/connect`,
      authData
    );
  }

  async disconnectProvider(providerType: ProviderType): Promise<void> {
    await apiClient.delete(
      `/api/integrations/providers/${providerType}/disconnect`
    );
  }

  async getProviderStatus(
    providerType: ProviderType
  ): Promise<{ connected: boolean }> {
    return apiClient.get<{ connected: boolean }>(
      `/api/integrations/providers/${providerType}/status`
    );
  }

  async getAvailability(request: {
    dateRange: { start: string; end: string };
    duration: number;
    providerTypes?: ProviderType[];
  }): Promise<any> {
    return apiClient.post<any>('/api/integrations/availability', request);
  }

  async startSync(dateRange?: { start: string; end: string }): Promise<{
    jobId: string;
    status: string;
  }> {
    const result = await apiClient.post<{ jobId: string }>(
      '/api/integrations/sync',
      { dateRange }
    );
    return {
      jobId: result.jobId,
      status: 'pending',
    };
  }
}

export const integrationsService = new IntegrationsService();
