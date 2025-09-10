import React, { useState, useEffect, useCallback } from 'react';
import { eventService, calendarService } from '../lib/api';
import { googleOAuthService } from '../lib/googleOAuth';
import { webSocketService } from '../lib/websocket.service';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useCalendarConnection } from '../hooks/useCalendarConnection';
import {
  EventFilterParams,
  GroupedEvents,
  EventListResponse,
  CalendarErrorCode,
  CreateEventDto,
} from '@ht-cal-01/shared-types';
import EventCard from './EventCard';
import ConfirmationModal from './ConfirmationModal';
import RefreshConfirmationModal from './RefreshConfirmationModal';
import { useToastStore } from '../stores/toastStore';
import CreateEventModal from './CreateEventModal';
import SyncStatusIndicator from './SyncStatusIndicator';
import CalendarConnectionIndicator from './CalendarConnectionIndicator';
import { useAuthStore } from '../stores/authStore';

const EventsList: React.FC = () => {
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({});
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [dateRange, setDateRange] = useState<'1' | '7' | '30'>('7');
  const [groupBy, setGroupBy] = useState<'day' | 'week'>('day');

  // Pagination state
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    nextCursor: undefined as string | undefined,
    hasPreviousPage: false,
    previousCursor: undefined as string | undefined,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { showSuccess, showError } = useToastStore();
  const { syncStatus, startSync, resetSyncStatus } = useSyncStatus();
  const { connectionStatus, startConnection, resetConnectionStatus } =
    useCalendarConnection();
  const { user } = useAuthStore();

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.id) {
      webSocketService.connect(user.id);
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [user?.id]);

  const fetchEvents = useCallback(
    async (cursor?: string, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
        setErrorCode(null);
      }

      try {
        const actualGroupBy = dateRange === '30' ? 'week' : 'day';
        setGroupBy(actualGroupBy);

        const params: EventFilterParams & { limit?: number; cursor?: string } =
          {
            dateRange,
            groupBy: actualGroupBy,
            limit: 3,
            ...(cursor && { cursor }),
          };

        const response = (await eventService.getEvents(
          params
        )) as EventListResponse;

        if (append) {
          setGroupedEvents(prev => {
            const merged = { ...prev };
            if (response.groupedEvents) {
              Object.keys(response.groupedEvents).forEach(key => {
                if (merged[key] && response.groupedEvents) {
                  merged[key] = [
                    ...merged[key],
                    ...response.groupedEvents[key],
                  ];
                } else if (response.groupedEvents) {
                  merged[key] = response.groupedEvents[key];
                }
              });
            }
            return merged;
          });
        } else {
          setGroupedEvents(response.groupedEvents || {});
        }

        // Update pagination state
        const responseWithPagination = response as EventListResponse & {
          hasNextPage?: boolean;
          nextCursor?: string;
          hasPreviousPage?: boolean;
          previousCursor?: string;
        };
        setPagination({
          hasNextPage: responseWithPagination.hasNextPage || false,
          nextCursor: responseWithPagination.nextCursor,
          hasPreviousPage: responseWithPagination.hasPreviousPage || false,
          previousCursor: responseWithPagination.previousCursor,
        });

        setIsCalendarConnected(true);
      } catch (err: unknown) {
        const errorData = (
          err as {
            response?: { data?: { error?: string; errorCode?: string } };
          }
        )?.response?.data;
        const errorMessage =
          errorData?.error ||
          'Failed to fetch calendar events. Please try again.';
        const errorCode =
          errorData?.errorCode || CalendarErrorCode.UNKNOWN_ERROR;
        setError(errorMessage);
        setErrorCode(errorCode);

        if (errorCode === CalendarErrorCode.NO_GOOGLE_TOKENS) {
          setIsCalendarConnected(false);
        }
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [dateRange]
  );

  const loadMoreEvents = useCallback(async () => {
    if (pagination.hasNextPage && pagination.nextCursor && !isLoadingMore) {
      await fetchEvents(pagination.nextCursor, true);
    }
  }, [
    pagination.hasNextPage,
    pagination.nextCursor,
    isLoadingMore,
    fetchEvents,
  ]);

  useEffect(() => {
    if (syncStatus.status === 'completed') {
      fetchEvents();
      setTimeout(() => {
        resetSyncStatus();
      }, 5000);
    }
  }, [syncStatus.status, fetchEvents, resetSyncStatus]);

  useEffect(() => {
    if (connectionStatus.status === 'completed') {
      setIsCalendarConnected(true);
      fetchEvents();
      setTimeout(() => {
        resetConnectionStatus();
      }, 5000);
    }
  }, [connectionStatus.status, fetchEvents, resetConnectionStatus]);

  const handleRefreshClick = () => {
    if (syncStatus.isSyncing) {
      return;
    }
    setShowRefreshModal(true);
  };

  const handleRefreshConfirm = async () => {
    setShowRefreshModal(false);
    try {
      await startSync();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start sync';
      showError('Sync Failed', errorMessage);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventDto) => {
    try {
      await eventService.createEvent(eventData);
      setShowCreateModal(false);
      showSuccess('Event Created', 'Event created successfully');
      await fetchEvents();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create event';
      showError('Create Failed', errorMessage);
    }
  };

  const handleDisconnectCalendar = async () => {
    setIsDisconnecting(true);
    try {
      await calendarService.disconnectCalendar();
      showSuccess(
        'Calendar Disconnected',
        'Calendar disconnected successfully'
      );
      setShowDisconnectModal(false);
      setGroupedEvents({});
      setIsCalendarConnected(false);

      fetchEvents();
    } catch (err: unknown) {
      const errorData = (
        err as { response?: { data?: { error?: string; errorCode?: string } } }
      )?.response?.data;
      const errorMessage =
        errorData?.error || 'Failed to disconnect calendar. Please try again.';
      showError('Disconnect Failed', errorMessage);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      // Get Google OAuth code for calendar access
      const googleCode = await googleOAuthService.requestCalendarAccess();
      await startConnection(googleCode);
    } catch (err: unknown) {
      const errorData = (
        err as { response?: { data?: { error?: string; errorCode?: string } } }
      )?.response?.data;
      const errorMessage =
        errorData?.error || 'Failed to connect calendar. Please try again.';
      showError('Connection Failed', errorMessage);
    }
  };

  const handleReAuthenticate = async () => {
    try {
      // Get Google OAuth code for calendar access
      const googleCode = await googleOAuthService.requestCalendarAccess();
      await startConnection(googleCode);
    } catch (err: unknown) {
      const errorData = (
        err as { response?: { data?: { error?: string; errorCode?: string } } }
      )?.response?.data;
      const errorMessage =
        errorData?.error || 'Failed to re-authenticate. Please try again.';
      showError('Authentication Failed', errorMessage);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset pagination when date range changes
  useEffect(() => {
    setPagination({
      hasNextPage: false,
      nextCursor: undefined,
      hasPreviousPage: false,
      previousCursor: undefined,
    });
  }, [dateRange]);

  if (error) {
    const isCalendarNotConnected =
      errorCode === CalendarErrorCode.NO_GOOGLE_TOKENS;
    const isAuthExpired = errorCode === CalendarErrorCode.GOOGLE_AUTH_EXPIRED;
    const isQuotaExceeded =
      errorCode === CalendarErrorCode.GOOGLE_QUOTA_EXCEEDED;
    const isAuthIssue = errorCode === CalendarErrorCode.GOOGLE_API_ERROR;
    const isPermissionIssue =
      errorCode === CalendarErrorCode.CALENDAR_ACCESS_DENIED;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {isCalendarNotConnected
                ? 'Calendar Not Connected'
                : 'Error Loading Events'}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {isCalendarNotConnected
                  ? 'Please connect your calendar to view and manage events.'
                  : error}
              </p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                {isCalendarNotConnected && (
                  <button
                    onClick={handleConnectCalendar}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Connect Calendar
                  </button>
                )}
                {isAuthExpired && (
                  <button
                    onClick={handleReAuthenticate}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Re-authenticate
                  </button>
                )}
                {(isQuotaExceeded || isAuthIssue || isPermissionIssue) && (
                  <button
                    onClick={() => fetchEvents()}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    );
  }

  // Only show "No events" state if calendar is connected and there are no events
  if (
    Object.keys(groupedEvents).length === 0 &&
    isCalendarConnected &&
    !error
  ) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new event.
        </p>
        <div className="mt-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Event
          </button>
        </div>
      </div>
    );
  }

  // safety check
  if (!isCalendarConnected && !error && !isLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Calendar Not Connected
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Please connect your calendar to view and manage events.</p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <button
                  onClick={handleReAuthenticate}
                  className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                >
                  Connect Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatWeek = (weekKey: string) => {
    // Handle ISO week format: "2025-W36"
    if (weekKey.includes('W')) {
      const [year, week] = weekKey.split('-W');
      const startOfWeek = new Date(parseInt(year), 0, 1);
      const dayOfYear = (parseInt(week) - 1) * 7;
      startOfWeek.setDate(startOfWeek.getDate() + dayOfYear);

      const dayOfWeek = startOfWeek.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${endOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}, ${startOfWeek.getFullYear()}`;
    }

    // Handle date format
    const start = new Date(weekKey);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  };

  return (
    <>
      <SyncStatusIndicator syncStatus={syncStatus} onClose={resetSyncStatus} />
      <CalendarConnectionIndicator
        connectionStatus={connectionStatus}
        onClose={resetConnectionStatus}
      />
      <div className="space-y-8">
        {/* Header with controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Time Range:
                </label>
                <select
                  value={dateRange}
                  onChange={e =>
                    setDateRange(e.target.value as '1' | '7' | '30')
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCalendarConnected && (
                <>
                  <button
                    onClick={handleRefreshClick}
                    disabled={syncStatus.isSyncing}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {syncStatus.isSyncing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    ) : (
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                    {syncStatus.isSyncing ? 'Syncing...' : 'Refresh'}
                  </button>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create Event
                  </button>

                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Events grouped by day or week */}
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
            <div
              key={dateKey}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {groupBy === 'week'
                        ? formatWeek(dateKey)
                        : formatDate(dateKey)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dayEvents.length} event
                      {dayEvents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {groupBy === 'week' ? (
                      <svg
                        className="h-5 w-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {dayEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {pagination.hasNextPage && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMoreEvents}
              disabled={isLoadingMore}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Loading more events...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Load More Events
                </>
              )}
            </button>
          </div>
        )}

        {/* Modals */}
        <ConfirmationModal
          isOpen={showDisconnectModal}
          onClose={() => setShowDisconnectModal(false)}
          onConfirm={handleDisconnectCalendar}
          title="Disconnect Calendar"
          message="Are you sure you want to disconnect your calendar? This will remove all synced events and you'll need to reconnect to access your calendar again."
          confirmText="Disconnect"
          isDestructive={true}
          isLoading={isDisconnecting}
        />

        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateEvent={handleCreateEvent}
        />

        <RefreshConfirmationModal
          isOpen={showRefreshModal}
          onClose={() => setShowRefreshModal(false)}
          onConfirm={handleRefreshConfirm}
          isLoading={syncStatus.isSyncing}
        />
      </div>
    </>
  );
};

export default EventsList;
