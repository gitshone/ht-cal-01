import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { calendarService } from '../lib/api';
import { CalendarEvent } from '@ht-cal-01/shared-types';
import moment from 'moment';
import EventCard from './EventCard';

const EventsList: React.FC = () => {
  const { getGoogleOAuthCode, logout, loginWithGoogle } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReAuthenticate = async () => {
    try {
      await logout();
      await loginWithGoogle();
    } catch (error) {
      console.error('Re-authentication failed:', error);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const googleCode = await getGoogleOAuthCode();
      if (googleCode) {
        await fetchEvents(googleCode);
      }
    } catch (error) {
      console.error('Calendar connection failed:', error);
    }
  };

  const fetchEvents = useCallback(async (googleCode?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await calendarService.getEvents(googleCode, {
        maxResults: 20,
        singleEvents: true,
        orderBy: 'startTime',
      });

      setEvents(response.events);
    } catch (err: unknown) {
      console.error('Failed to fetch events:', err);

      const errorMessage =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to fetch calendar events. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    );
  }

  if (error) {
    const isCalendarNotConnected =
      error.includes('not connected') ||
      error.includes('connect your calendar');
    const isAuthExpired =
      error.includes('access expired') ||
      error.includes('reconnect your calendar');
    const isQuotaExceeded = error.includes('quota exceeded');
    const isAuthIssue =
      error.includes('log in') || error.includes('authenticated');

    return (
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
                : isAuthIssue
                ? 'Authentication Required'
                : 'Error Loading Events'}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4 space-x-3">
              {/* Show appropriate buttons based on error type */}
              {(isCalendarNotConnected || isAuthExpired) && (
                <button
                  onClick={handleConnectCalendar}
                  className="bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isCalendarNotConnected
                    ? 'Connect Calendar'
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
                !isAuthIssue && (
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
    );
  }

  if (events.length === 0) {
    return (
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
        <div className="mt-6 space-x-3">
          <button
            onClick={() => fetchEvents()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh Events
          </button>
          <button
            onClick={handleConnectCalendar}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reconnect Calendar
          </button>
        </div>
      </div>
    );
  }

  const upcomingEvents = events.filter(event =>
    moment(event.date).isAfter(moment(), 'day')
  );
  const pastEvents = events.filter(event =>
    moment(event.date).isBefore(moment(), 'day')
  );
  const todayEvents = events.filter(event =>
    moment(event.date).isSame(moment(), 'day')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Calendar Events ({events.length})
        </h2>
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
    </div>
  );
};

export default EventsList;
