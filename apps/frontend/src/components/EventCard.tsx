import React from 'react';
import { CalendarEvent } from '@ht-cal-01/shared-types';
import moment from 'moment';

interface EventCardProps {
  event: CalendarEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const eventDate = moment(event.date);
  const isEventPast = eventDate.isBefore(moment(), 'day');

  const formatDate = (date: string) => {
    const momentDate = moment(date);
    if (momentDate.isSame(moment(), 'day')) return 'Today';
    if (momentDate.isSame(moment().add(1, 'day'), 'day')) return 'Tomorrow';
    if (momentDate.isSame(moment().subtract(1, 'day'), 'day'))
      return 'Yesterday';
    return momentDate.format('MMM D, YYYY');
  };

  const formatTime = (time: string) => {
    return moment(time, 'HH:mm:ss').format('h:mm A');
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
        isEventPast ? 'border-gray-200 opacity-75' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className={`text-lg font-semibold mb-2 ${
              isEventPast ? 'text-gray-500' : 'text-gray-900'
            }`}
          >
            {event.name}
          </h3>

          <div className="flex items-center text-sm text-gray-600 mb-1">
            <svg
              className="h-4 w-4 mr-2 text-gray-400"
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
            {formatDate(event.date)}
          </div>

          {!event.isAllDay && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="h-4 w-4 mr-2 text-gray-400"
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
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </div>
          )}

          {event.isAllDay && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="h-4 w-4 mr-2 text-gray-400"
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
              All day
            </div>
          )}
        </div>

        <div className="flex flex-col items-end space-y-1">
          {event.isAllDay && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              All Day
            </span>
          )}
          {isEventPast && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Past
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
