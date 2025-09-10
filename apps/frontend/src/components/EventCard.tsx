import React from 'react';
import { Event } from '@ht-cal-01/shared-types';
import moment from 'moment';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const now = moment();
  const startDate = moment(event.startDate);
  const endDate = moment(event.endDate);

  // Determine event status based on current time
  const getEventStatus = () => {
    if (event.isAllDay) {
      if (endDate.isBefore(now, 'day')) {
        return 'finished';
      } else if (
        startDate.isSameOrBefore(now, 'day') &&
        endDate.isSameOrAfter(now, 'day')
      ) {
        return 'in-progress';
      } else {
        return 'upcoming';
      }
    } else {
      if (endDate.isBefore(now)) {
        return 'finished';
      } else if (startDate.isSameOrBefore(now) && endDate.isAfter(now)) {
        return 'in-progress';
      } else {
        return 'upcoming';
      }
    }
  };

  const eventStatus = getEventStatus();
  const isEventPast = eventStatus === 'finished';
  const isEventInProgress = eventStatus === 'in-progress';
  const isEventUpcoming = eventStatus === 'upcoming';

  const formatDate = (date: Date) => {
    const momentDate = moment(date);
    if (momentDate.isSame(moment(), 'day')) return 'Today';
    if (momentDate.isSame(moment().add(1, 'day'), 'day')) return 'Tomorrow';
    if (momentDate.isSame(moment().subtract(1, 'day'), 'day'))
      return 'Yesterday';
    return momentDate.format('MMM D, YYYY');
  };

  // Get border color based on status
  const getBorderColor = () => {
    if (isEventPast) return 'border-l-gray-300';
    if (isEventInProgress) return 'border-l-orange-500';
    return 'border-l-blue-500';
  };

  return (
    <div
      className={`group relative bg-white rounded-xl border-l-4 p-5 hover:shadow-lg transition-all duration-200 ${
        isEventPast
          ? `${getBorderColor()} border border-gray-100 opacity-75`
          : `${getBorderColor()} border border-gray-100 hover:border-l-blue-600`
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-semibold mb-3 leading-tight ${
              isEventPast
                ? 'text-gray-500'
                : 'text-gray-900 group-hover:text-blue-700'
            }`}
          >
            {event.title}
          </h3>

          <div className="flex items-center text-sm text-gray-600 mb-2">
            <div className="flex items-center">
              <svg
                className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0"
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
              <span className="truncate">
                {(event as Event & { displayDate?: string }).displayDate ||
                  formatDate(event.startDate)}
              </span>
            </div>
          </div>

          {(event as Event & { timezone?: string }).timezone && (
            <div className="flex items-center text-xs text-gray-500">
              <svg
                className="h-3 w-3 mr-1 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {(event as Event & { timezone?: string }).timezone}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end space-y-2 ml-4">
          {event.isAllDay && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              All Day
            </span>
          )}

          {/* Event Status Badges */}
          {isEventPast && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Finished
            </span>
          )}

          {isEventInProgress && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
              <svg
                className="w-3 h-3 mr-1 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              In Progress
            </span>
          )}

          {isEventUpcoming && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Upcoming
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
