import React from 'react';
import dayjs from 'dayjs';
import { Event } from '@ht-cal-01/shared-types';
import { timezoneService } from '../../services/timezone.service';

interface EventOverflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: dayjs.Dayjs;
  events: Event[];
  onEventClick: (event: Event) => void;
  position: { top: number; left: number };
  visibleEventCount?: number;
}

const EventOverflowModal: React.FC<EventOverflowModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  onEventClick,
  position,
  visibleEventCount = 0,
}) => {
  if (!isOpen) return null;

  const handleEventClick = (event: Event) => {
    onEventClick(event);
    onClose();
  };

  const hiddenEvents = events.slice(visibleEventCount);

  const calculateOptimalPosition = () => {
    const modalWidth = 256;
    const modalHeight = Math.min(320, 16 + hiddenEvents.length * 40 + 8);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { top, left } = position;

    if (left + modalWidth > viewportWidth) {
      left = viewportWidth - modalWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    if (top + modalHeight > viewportHeight) {
      top = position.top - modalHeight - 8;
    }
    if (top < 16) {
      top = 16;
    }

    return { top, left };
  };

  const optimalPosition = calculateOptimalPosition();

  const getEventColors = (event: Event) => {
    switch (event.providerType) {
      case 'google':
        return {
          bg: event.isAllDay ? 'bg-blue-100' : '',
          text: 'text-blue-800',
          hover: event.isAllDay ? 'hover:bg-blue-200' : 'hover:bg-gray-200',
        };
      case 'microsoft':
        return {
          bg: event.isAllDay ? 'bg-green-100' : '',
          text: 'text-green-800',
          hover: event.isAllDay ? 'hover:bg-green-200' : 'hover:bg-gray-200',
        };
      case 'zoom':
        return {
          bg: event.isAllDay ? 'bg-purple-100' : '',
          text: 'text-purple-800',
          hover: event.isAllDay ? 'hover:bg-purple-200' : 'hover:bg-gray-200',
        };
      default:
        return {
          bg: event.isAllDay ? 'bg-gray-100' : '',
          text: 'text-gray-800',
          hover: event.isAllDay ? 'hover:bg-gray-200' : 'hover:bg-gray-200',
        };
    }
  };

  const formatEventTime = (event: Event) => {
    if (event.isAllDay) return 'All day';

    const start = timezoneService.fromUTC(event.startDate);
    const end = timezoneService.fromUTC(event.endDate);

    const startTime = start.format('h:mm A');
    const endTime = end.format('h:mm A');

    return `${startTime} - ${endTime}`;
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs w-64 max-h-80 overflow-y-auto"
        style={{
          top: `${optimalPosition.top}px`,
          left: `${optimalPosition.left}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">
            {date.format('MMM D')}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <svg
              className="w-4 h-4"
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
          </button>
        </div>

        <div className="p-2 space-y-1">
          {hiddenEvents.map(event => {
            const colors = getEventColors(event);
            return (
              <div
                key={event.id}
                className={`text-xs cursor-pointer transition-all duration-200 font-normal rounded-sm px-2 py-1 ${colors.bg} ${colors.text} ${colors.hover}`}
                onClick={e => {
                  e.stopPropagation();
                  handleEventClick(event);
                }}
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="text-xs opacity-75">
                  {formatEventTime(event)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventOverflowModal;
