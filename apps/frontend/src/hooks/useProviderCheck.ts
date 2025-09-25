import { useConnectedProviders } from './queries/integrationsQueries';

export const useProviderCheck = () => {
  const { data: connectedProviders = [], isLoading } = useConnectedProviders();

  return {
    hasConnectedProviders: connectedProviders.length > 0,
    connectedProviders,
    isLoading,
  };
};
