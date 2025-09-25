import React, { useState, useEffect } from 'react';
import { ProviderType, ProviderUpdateEvent } from '@ht-cal-01/shared-types';
import {
  useConnectedProviders,
  useProviderConfigs,
  useConnectProvider,
  useDisconnectProvider,
} from '../../hooks/queries/integrationsQueries';
import { googleOAuthService } from '../../lib/googleOAuth';
import { useAppDispatch } from '../../hooks/redux';
import { showSuccess, showError } from '../../store/slices/toastSlice';
import { webSocketService } from '../../lib/websocket.service';
import ConfirmationModal from '../modals/ConfirmationModal';

type ConnectedAppsTabProps = Record<string, never>;

const ConnectedAppsTab: React.FC<ConnectedAppsTabProps> = () => {
  const [connectingProvider, setConnectingProvider] =
    useState<ProviderType | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<ProviderType | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] =
    useState<ProviderType | null>(null);

  const dispatch = useAppDispatch();
  const { data: connectedProviders = [], isLoading: providersLoading } =
    useConnectedProviders();
  const { data: providerConfigs = [], isLoading: configsLoading } =
    useProviderConfigs();

  const connectProviderMutation = useConnectProvider();
  const disconnectProviderMutation = useDisconnectProvider();

  const isLoading = providersLoading || configsLoading;

  // Listen for WebSocket provider updates
  useEffect(() => {
    const unsubscribe = webSocketService.onProviderUpdate(
      (event: ProviderUpdateEvent) => {
        switch (event.type) {
          case 'provider_connected':
            if (event.data?.connected) {
              dispatch(
                showSuccess({
                  title: `${event.providerType} Connected`,
                  message:
                    event.message ||
                    `${event.providerType} connected successfully`,
                })
              );
            } else {
              dispatch(
                showError({
                  title: `${event.providerType} Connection Failed`,
                  message:
                    event.message ||
                    `Failed to connect to ${event.providerType}`,
                })
              );
            }
            break;
          case 'provider_disconnected':
            dispatch(
              showSuccess({
                title: `${event.providerType} Disconnected`,
                message:
                  event.message ||
                  `${event.providerType} disconnected successfully`,
              })
            );
            break;
        }
      }
    );

    return unsubscribe;
  }, [dispatch]);

  const handleConnectProvider = async (providerType: ProviderType) => {
    setConnectingProvider(providerType);

    try {
      if (providerType === 'google') {
        const googleCode = await googleOAuthService.requestCalendarAccess();
        await connectProviderMutation.mutateAsync({
          providerType,
          authData: { code: googleCode },
        });

        dispatch(
          showSuccess({
            title: 'Google Calendar Connected',
            message: 'Google Calendar has been connected successfully',
          })
        );
      } else {
        // todo
        await connectProviderMutation.mutateAsync({
          providerType,
          authData: {},
        });

        dispatch(
          showSuccess({
            title: `${providerType} Connected`,
            message: `${providerType} has been connected successfully`,
          })
        );
      }
    } catch (error) {
      console.error('Failed to connect provider:', error);
      dispatch(
        showError({
          title: 'Connection Failed',
          message: 'Failed to connect provider. Please try again.',
        })
      );
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnectProvider = (providerType: ProviderType) => {
    setProviderToDisconnect(providerType);
    setShowDisconnectConfirm(true);
  };

  const confirmDisconnect = async () => {
    if (!providerToDisconnect) return;

    setDisconnectingProvider(providerToDisconnect);
    setShowDisconnectConfirm(false);

    try {
      await disconnectProviderMutation.mutateAsync(providerToDisconnect);

      dispatch(
        showSuccess({
          title: `${providerToDisconnect} Disconnected`,
          message: `${providerToDisconnect} has been disconnected successfully`,
        })
      );
    } catch (error) {
      console.error('Failed to disconnect provider:', error);
      dispatch(
        showError({
          title: 'Disconnect Failed',
          message: 'Failed to disconnect provider. Please try again.',
        })
      );
    } finally {
      setDisconnectingProvider(null);
      setProviderToDisconnect(null);
    }
  };

  const getProviderIcon = (providerType: ProviderType) => {
    switch (providerType) {
      case 'google':
        return (
          <img
            src="/provider-icons/google.png"
            alt="Google Calendar"
            className="w-8 h-8"
          />
        );
      case 'microsoft':
        return (
          <img
            src="/provider-icons/teams.png"
            alt="Microsoft Teams"
            className="w-8 h-8"
          />
        );
      case 'zoom':
        return (
          <img src="/provider-icons/zoom.png" alt="Zoom" className="w-8 h-8" />
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg">
            <span role="img" aria-label="Link icon">
              🔗
            </span>
          </div>
        );
    }
  };

  const getProviderName = (providerType: ProviderType) => {
    switch (providerType) {
      case 'google':
        return 'Google Calendar';
      case 'microsoft':
        return 'Microsoft Teams';
      case 'zoom':
        return 'Zoom';
      default:
        return providerType;
    }
  };

  const getProviderDescription = (providerType: ProviderType) => {
    switch (providerType) {
      case 'google':
        return 'Sync your Google Calendar events and create meetings';
      case 'microsoft':
        return 'Create Teams meetings and sync calendar events';
      case 'zoom':
        return 'Create Zoom video meetings and sync calendar events';
      default:
        return 'Connect your calendar and meeting platform';
    }
  };

  const isProviderConnected = (providerType: ProviderType) => {
    return connectedProviders.some(
      provider => provider.providerType === providerType && provider.isActive
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading connected apps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connected Apps
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Connect your calendar and meeting platforms to sync events and create
          meetings seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providerConfigs.map(config => {
          const providerType = config.type as ProviderType;
          const isConnected = isProviderConnected(providerType);
          const isConnecting = connectingProvider === providerType;
          const isDisconnecting = disconnectingProvider === providerType;

          return (
            <div
              key={providerType}
              className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                isConnected
                  ? 'border-green-200 bg-green-50/50 hover:border-green-300'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                      isConnected ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    {getProviderIcon(providerType)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {getProviderName(providerType)}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {getProviderDescription(providerType)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">
                        Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600">
                        Not connected
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnectProvider(providerType)}
                      disabled={isDisconnecting}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDisconnecting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-3 w-3 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Disconnect
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectProvider(providerType)}
                      disabled={isConnecting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isConnecting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmationModal
        isOpen={showDisconnectConfirm}
        onClose={() => {
          setShowDisconnectConfirm(false);
          setProviderToDisconnect(null);
        }}
        onConfirm={confirmDisconnect}
        title="Disconnect Provider"
        message={`Are you sure you want to disconnect ${providerToDisconnect}? This will remove all calendar integration.`}
        confirmText="Disconnect"
        cancelText="Cancel"
        variant="warning"
        isLoading={!!disconnectingProvider}
      />
    </div>
  );
};

export default ConnectedAppsTab;
