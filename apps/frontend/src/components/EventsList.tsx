import React, { useState, useEffect, useCallback } from 'react';
import { calendarService } from '../lib/api';
import { googleOAuthService } from '../lib/googleOAuth';
import { webSocketService } from '../lib/websocket.service';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useCalendarConnection } from '../hooks/useCalendarConnection';
import {
  EventFilterParams,
  CalendarErrorCode,
  CreateEventDto,
  Event as CalendarEvent,
} from '@ht-cal-01/shared-types';
import EventCard from './EventCard';
import ConfirmationModal from './modals/ConfirmationModal';
import RefreshConfirmationModal from './modals/RefreshConfirmationModal';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { showSuccess, showError } from '../store/slices/toastSlice';
import CreateEventModal from './modals/CreateEventModal';
import UpdateEventModal from './modals/UpdateEventModal';
import SyncStatusIndicator from './indicators/SyncStatusIndicator';
import CalendarConnectionIndicator from './indicators/CalendarConnectionIndicator';
import CalendarView from './CalendarView';
import { useEvents, useCreateEvent } from '../hooks/queries/eventQueries';
import { setViewType } from '../store/slices/viewTypeSlice';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const EventsList: React.FC = () => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [dateRange, setDateRange] = useState<'1' | '7' | '30'>('7');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { viewType } = useAppSelector(state => state.viewType);

  const { syncStatus, startSync, resetSyncStatus } = useSyncStatus();
  const { connectionStatus, startConnection, resetConnectionStatus } =
    useCalendarConnection();

  // React Query hooks
  const actualGroupBy = dateRange === '30' ? 'week' : 'day';
  const eventParams: EventFilterParams = {
    dateRange,
    groupBy: actualGroupBy,
    limit: 10,
  };

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents(eventParams);

  const createEventMutation = useCreateEvent();
  const groupedEvents = eventsData?.groupedEvents || {};
  const isLoading = eventsLoading;
  const error = eventsError?.message || null;
  const errorCode = (eventsError as any)?.response?.data?.errorCode || null;

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      webSocketService.connect(user.id);
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [user?.id, isAuthenticated]);

  const checkConnectionStatus = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const status = await calendarService.getConnectionStatus();
      setIsCalendarConnected(status.connected);
    } catch (error) {
      console.error('Failed to check calendar connection:', error);
      setIsCalendarConnected(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (syncStatus.status === 'completed') {
      refetchEvents();
      setTimeout(() => {
        resetSyncStatus();
      }, 5000);
    }
  }, [syncStatus.status, refetchEvents, resetSyncStatus]);

  useEffect(() => {
    if (connectionStatus.status === 'completed') {
      setIsCalendarConnected(true);
      refetchEvents();
      setTimeout(() => {
        resetConnectionStatus();
      }, 5000);
    }
  }, [connectionStatus.status, refetchEvents, resetConnectionStatus]);

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
      dispatch(showError({ title: 'Sync Failed', message: errorMessage }));
    }
  };

  const handleCreateEvent = async (eventData: CreateEventDto) => {
    await createEventMutation.mutateAsync(eventData);
    setShowCreateModal(false);
    dispatch(
      showSuccess({
        title: 'Event Created',
        message: 'Event created successfully',
      })
    );
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowUpdateModal(true);
  };

  const handleEventUpdated = async (updatedEvent: CalendarEvent) => {
    setShowUpdateModal(false);
    setSelectedEvent(null);
    dispatch(
      showSuccess({
        title: 'Event Updated',
        message: 'Event updated successfully',
      })
    );
  };

  const handleEventDeleted = async () => {
    setShowUpdateModal(false);
    setSelectedEvent(null);
    dispatch(
      showSuccess({
        title: 'Event Deleted',
        message: 'Event deleted successfully',
      })
    );
  };

  const handleDisconnectCalendar = async () => {
    setIsDisconnecting(true);
    try {
      await calendarService.disconnectCalendar();
      dispatch(
        showSuccess({
          title: 'Calendar Disconnected',
          message: 'Calendar disconnected successfully',
        })
      );
      setShowDisconnectModal(false);
      setIsCalendarConnected(false);

      refetchEvents();
    } catch (err: unknown) {
      const errorData = (
        err as { response?: { data?: { error?: string; errorCode?: string } } }
      )?.response?.data;
      const errorMessage =
        errorData?.error || 'Failed to disconnect calendar. Please try again.';
      dispatch(
        showError({ title: 'Disconnect Failed', message: errorMessage })
      );
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
      dispatch(
        showError({ title: 'Connection Failed', message: errorMessage })
      );
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
      dispatch(
        showError({ title: 'Authentication Failed', message: errorMessage })
      );
    }
  };

  useEffect(() => {
    if (isInitialLoad) {
      setDateRange('7');
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  useEffect(() => {
    if (user?.id && isAuthenticated) {
      checkConnectionStatus();
      refetchEvents();
    }
  }, [
    checkConnectionStatus,
    refetchEvents,
    user?.id,
    isAuthenticated,
    dateRange,
  ]);

  // Refetch events when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refetchEvents();
    }
  }, [isAuthenticated, user?.id, refetchEvents]);

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
                    onClick={() => refetchEvents()}
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

  if (!user || user.hasEvents === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
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

  // Show "No events" state only if user has no events at all
  const shouldShowEmptyState =
    user?.hasEvents === false &&
    !error &&
    !isLoading &&
    !showCreateModal &&
    !showRefreshModal &&
    !showDisconnectModal &&
    !showUpdateModal;

  // Determine if user has events but none in current range
  const hasEventsButNoneInRange =
    user?.hasEvents === true && Object.keys(groupedEvents).length === 0;

  const hasEventsData = Object.keys(groupedEvents).length > 0;

  // If we have events data, always show it regardless of hasEvents property
  if (hasEventsData) {
    // Skip empty state and show events
  } else if (shouldShowEmptyState) {
    return (
      <>
        <SyncStatusIndicator
          syncStatus={syncStatus}
          onClose={resetSyncStatus}
        />
        <CalendarConnectionIndicator
          connectionStatus={connectionStatus}
          onClose={resetConnectionStatus}
        />
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
            {isCalendarConnected
              ? 'Get started by creating a new event.'
              : 'Connect your Google Calendar to sync events or create new ones.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {isCalendarConnected ? (
              <>
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
                  {syncStatus.isSyncing ? 'Syncing...' : 'Sync Calendar'}
                </button>
                <button
                  onClick={() => setShowDisconnectModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Disconnect Calendar
                </button>
              </>
            ) : (
              <button
                onClick={() => googleOAuthService.requestCalendarAccess()}
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

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

        <UpdateEventModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
          onEventDeleted={handleEventDeleted}
        />

        <RefreshConfirmationModal
          isOpen={showRefreshModal}
          onClose={() => setShowRefreshModal(false)}
          onConfirm={handleRefreshConfirm}
          isLoading={syncStatus.isSyncing}
        />
      </>
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
    const date = dayjs(dateString);
    return date.format('dddd, MMMM D, YYYY');
  };

  const formatWeek = (weekKey: string) => {
    // Handle ISO week format: "2025-W01", "2025-W36", etc.
    if (weekKey.includes('W')) {
      const [year, week] = weekKey.split('-W');
      const weekNumber = parseInt(week);

      const yearStart = dayjs(`${year}-01-01`);

      const firstMonday =
        yearStart.day() === 1
          ? yearStart
          : yearStart.add(8 - yearStart.day(), 'day');

      const weekStart = firstMonday.add((weekNumber - 1) * 7, 'day');
      const weekEnd = weekStart.add(6, 'day');

      if (weekStart.month() === weekEnd.month()) {
        return `${weekStart.format('MMM D')} - ${weekEnd.format('D, YYYY')}`;
      } else {
        return `${weekStart.format('MMM D')} - ${weekEnd.format(
          'MMM D, YYYY'
        )}`;
      }
    }

    const start = dayjs(weekKey);
    const end = start.add(6, 'day');

    return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
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
                  View:
                </label>
                <select
                  value={viewType}
                  onChange={e =>
                    dispatch(setViewType(e.target.value as 'list' | 'calendar'))
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="list">List View</option>
                  <option value="calendar">Calendar View</option>
                </select>
              </div>

              {viewType === 'list' && (
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
              )}
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

        {/* Conditional rendering based on view type */}
        {viewType === 'calendar' ? (
          <CalendarView
            onCreateEvent={handleCreateEvent}
            onEventClick={handleEventClick}
            groupBy={actualGroupBy}
          />
        ) : (
          /* Events grouped by day or week */
          <div className="space-y-8">
            {Object.keys(groupedEvents).length > 0 ? (
              Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
                <div
                  key={dateKey}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {actualGroupBy === 'week'
                            ? formatWeek(dateKey)
                            : formatDate(dateKey)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {dayEvents.length} event
                          {dayEvents.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {actualGroupBy === 'week' ? (
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
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={handleEventClick}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : hasEventsButNoneInRange ? (
              /* Info box when user has events but none in current range */
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      No events in selected range
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        No events found in the selected{' '}
                        {dateRange === '1'
                          ? '1 day'
                          : dateRange === '7'
                          ? '7 days'
                          : '30 days'}{' '}
                        range. Try adjusting the time range or create a new
                        event.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
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

        <UpdateEventModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
          onEventDeleted={handleEventDeleted}
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
