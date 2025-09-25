import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationsService } from '../../lib/api/integrations.service';
import { ProviderType } from '@ht-cal-01/shared-types';

// Query Keys
export const integrationsKeys = {
  all: ['integrations'] as const,
  providers: () => [...integrationsKeys.all, 'providers'] as const,
  providerConfigs: () => [...integrationsKeys.all, 'providerConfigs'] as const,
  providerStatus: (providerType: ProviderType) =>
    [...integrationsKeys.all, 'providerStatus', providerType] as const,
  availability: (params: any) =>
    [...integrationsKeys.all, 'availability', params] as const,
};

// Hooks
export const useConnectedProviders = () => {
  return useQuery({
    queryKey: integrationsKeys.providers(),
    queryFn: () => integrationsService.getConnectedProviders(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProviderConfigs = () => {
  return useQuery({
    queryKey: integrationsKeys.providerConfigs(),
    queryFn: () => integrationsService.getProviderConfigs(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProviderStatus = (providerType: ProviderType) => {
  return useQuery({
    queryKey: integrationsKeys.providerStatus(providerType),
    queryFn: () => integrationsService.getProviderStatus(providerType),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAvailability = (params: {
  dateRange: { start: string; end: string };
  duration: number;
  providerTypes?: ProviderType[];
}) => {
  return useQuery({
    queryKey: integrationsKeys.availability(params),
    queryFn: () => integrationsService.getAvailability(params),
    enabled: !!params.dateRange.start && !!params.dateRange.end,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Mutations
export const useConnectProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      providerType,
      authData,
    }: {
      providerType: ProviderType;
      authData: any;
    }) => integrationsService.connectProvider(providerType, authData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.providers() });
      queryClient.invalidateQueries({
        queryKey: integrationsKeys.providerConfigs(),
      });
    },
  });
};

export const useDisconnectProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerType: ProviderType) =>
      integrationsService.disconnectProvider(providerType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationsKeys.providers() });
      queryClient.invalidateQueries({
        queryKey: integrationsKeys.providerConfigs(),
      });
    },
  });
};
