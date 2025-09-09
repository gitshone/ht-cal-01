import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { calendarService } from '../lib/api';
import { CalendarErrorCode, CalendarEvent } from '@ht-cal-01/shared-types';
import EventCard from './EventCard';
import ConfirmationModal from './ConfirmationModal';
import ToastContainer from './ToastContainer';
import { useToast } from '../hooks/useToast';

const EventsList: React.FC = () => {
  const { getGoogleOAuthCode, logout, loginWithGoogle } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const handleReAuthenticate = async () => {
    try {
      await logout();
      await loginWithGoogle();
    } catch (error) {
      console.error('Re-authentication failed:', error);
    }
  };

  const handleDisconnectCalendar = async () => {
    setIsDisconnecting(true);
    try {
      await calendarService.disconnectCalendar();
      setEvents([]);
      setError(null);
      setShowDisconnectModal(false);

      showSuccess(
        'Calendar Disconnected',
        'Google Calendar has been disconnected successfully'
      );

      await fetchEvents();
    } catch {
      showError(
        'Disconnect Failed',
        'Unable to disconnect calendar. Please try again.'
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const googleCode = await getGoogleOAuthCode();

      if (googleCode) {
        await calendarService.connectCalendar(googleCode);
        setError(null);

        showSuccess(
          'Calendar Connected',
          'Google Calendar has been connected successfully'
        );

        await fetchEvents();
      } else {
        showError(
          'Authorization Failed',
          'Unable to get authorization from Google. Please try again.'
        );
      }
    } catch {
      showError(
        'Connection Failed',
        'Unable to connect calendar. Please try again.'
      );
    }
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const response = await calendarService.getEvents({
        maxResults: 20,
        singleEvents: true,
        orderBy: 'startTime',
      });

      setEvents(response.events);
    } catch (err: unknown) {
      const errorData = (
        err as { response?: { data?: { error?: string; errorCode?: string } } }
      )?.response?.data;
      const errorMessage =
        errorData?.error ||
        'Failed to fetch calendar events. Please try again.';
      const errorCode = errorData?.errorCode || 'UNKNOWN_ERROR';

      setError(errorMessage);
      setErrorCode(errorCode);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (isLoading) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading events...</span>
        </div>
      </>
    );
  }

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
      <>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
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
                  : isAuthExpired
                  ? 'Access Expired'
                  : isQuotaExceeded
                  ? 'Quota Exceeded'
                  : isPermissionIssue
                  ? 'Permission Denied'
                  : isAuthIssue
                  ? 'Authentication Required'
                  : 'Error Loading Events'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4 space-x-3">
                {/* Show appropriate buttons based on error type */}
                {(isCalendarNotConnected ||
                  isAuthExpired ||
                  isPermissionIssue) && (
                  <button
                    onClick={handleConnectCalendar}
                    className="bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isCalendarNotConnected
                      ? 'Connect Calendar'
                      : isPermissionIssue
                      ? 'Grant Permissions'
                      : 'Reconnect Calendar'}
                  </button>
                )}

                {isQuotaExceeded && (
                  <button
                    onClick={() => fetchEvents()}
                    className="bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again Later
                  </button>
                )}

                {isAuthIssue && (
                  <button
                    onClick={handleReAuthenticate}
                    className="bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Log In Again
                  </button>
                )}

                {!isCalendarNotConnected &&
                  !isAuthExpired &&
                  !isQuotaExceeded &&
                  !isAuthIssue &&
                  !isPermissionIssue && (
                    <button
                      onClick={() => fetchEvents()}
                      className="bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Try Again
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (events.length === 0) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Calendar Events (0)
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Disconnect
              </button>
              <button
                onClick={() => fetchEvents()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="h-4 w-4 mr-2"
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
                Refresh
              </button>
            </div>
          </div>

          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No events found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any upcoming events in your calendar.
            </p>
          </div>

          <ConfirmationModal
            isOpen={showDisconnectModal}
            onClose={() => setShowDisconnectModal(false)}
            onConfirm={handleDisconnectCalendar}
            title="Disconnect Google Calendar"
            message="Are you sure you want to disconnect your Google Calendar? This will remove all calendar access and you'll need to reconnect to view events again."
            confirmText="Disconnect"
            cancelText="Cancel"
            isDestructive={true}
            isLoading={isDisconnecting}
          />
        </div>
      </>
    );
  }

  // Filter events by date - ensure no overlap between categories
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= todayStart && eventDate < todayEnd;
  });

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= todayEnd;
  });

  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate < todayStart;
  });

  return (
    <>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Calendar Events ({events.length})
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDisconnectModal(true)}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Disconnect
            </button>
            <button
              onClick={() => fetchEvents()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                className="h-4 w-4 mr-2"
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
              Refresh
            </button>
          </div>
        </div>

        {todayEvents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-blue-800">
              Today ({todayEvents.length})
            </h3>
            <div className="grid gap-4">
              {todayEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-800">
              Upcoming Events ({upcomingEvents.length})
            </h3>
            <div className="grid gap-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-600">
              Past Events ({pastEvents.length})
            </h3>
            <div className="grid gap-4">
              {pastEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={showDisconnectModal}
          onClose={() => setShowDisconnectModal(false)}
          onConfirm={handleDisconnectCalendar}
          title="Disconnect Google Calendar"
          message="Are you sure you want to disconnect your Google Calendar? This will remove all calendar access and you'll need to reconnect to view events again."
          confirmText="Disconnect"
          cancelText="Cancel"
          isDestructive={true}
          isLoading={isDisconnecting}
        />
      </div>
    </>
  );
};

export default EventsList;
