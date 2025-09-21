import React, { useState } from 'react';
import { useEvents } from '../hooks/queries/eventQueries';
import {
  Event as CalendarEvent,
  EventFilterParams,
} from '@ht-cal-01/shared-types';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import CreateEventModal from './modals/CreateEventModal';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

interface CalendarViewProps {
  onCreateEvent: (eventData: any) => Promise<void>;
  onEventClick?: (event: CalendarEvent) => void;
  groupBy?: 'day' | 'week';
}

interface CalendarEventWithDisplay extends CalendarEvent {
  displayDate?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  onCreateEvent,
  onEventClick,
  groupBy = 'day',
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // React Query hook for events
  const params: EventFilterParams = {
    dateRange: '30',
    groupBy: groupBy as 'day' | 'week',
    limit: 100,
  };

  const { data: eventsData, isLoading, error: eventsError } = useEvents(params);

  const events: CalendarEventWithDisplay[] = React.useMemo(() => {
    if (!eventsData?.groupedEvents) return [];

    const allEvents: CalendarEvent[] = [];
    Object.values(eventsData.groupedEvents).forEach(dayEvents => {
      allEvents.push(...dayEvents);
    });

    return allEvents;
  }, [eventsData?.groupedEvents]);

  const error = eventsError?.message || null;

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleCreateEvent = async (eventData: any) => {
    await onCreateEvent(eventData);
    setShowCreateModal(false);
    setSelectedDate(null);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedDate(null);
  };

  const getEventsForDate = (date: string) => {
    const targetDate = dayjs(date);

    return events.filter(event => {
      const eventStartDate = dayjs(event.startDate).startOf('day');
      const eventEndDate = dayjs(event.endDate).startOf('day');

      return (
        targetDate.isSameOrAfter(eventStartDate) &&
        targetDate.isSameOrBefore(eventEndDate)
      );
    });
  };

  const getEventPosition = (event: CalendarEvent, date: string) => {
    const targetDate = dayjs(date);
    const eventStartDate = dayjs(event.startDate).startOf('day');
    const eventEndDate = dayjs(event.endDate).startOf('day');

    const isStart = targetDate.isSame(eventStartDate);
    const isEnd = targetDate.isSame(eventEndDate);
    const isMiddle = !isStart && !isEnd;

    return { isStart, isEnd, isMiddle };
  };

  const renderCalendarGrid = () => {
    const today = dayjs();
    const startDate = today.startOf('day');
    const endDate = today.add(30, 'days').endOf('day');

    const days = [];
    let current = startDate.clone();

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      days.push(current.clone());
      current = current.add(1, 'day');
    }

    const startDayOfWeek = startDate.day();
    const paddedDays = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      paddedDays.push(null);
    }

    paddedDays.push(...days);

    return paddedDays.map((day, index) => {
      if (!day) {
        return (
          <div
            key={`empty-${index}`}
            className="min-h-[120px] p-2 border border-gray-200 bg-gray-50"
          />
        );
      }
      const dateStr = day.format('YYYY-MM-DD');
      const dayEvents = getEventsForDate(dateStr);
      const isToday = day.isSame(today, 'day');
      const isPast = day.isBefore(today, 'day');

      return (
        <div
          key={dateStr}
          className={`
            min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
            ${isToday ? 'bg-blue-50 border-blue-300' : ''}
            ${isPast ? 'bg-gray-50' : 'bg-white'}
          `}
          onClick={() => handleDateClick(dateStr)}
        >
          <div className="flex flex-col h-full">
            <div
              className={`
              text-sm font-medium mb-1
              ${
                isToday
                  ? 'text-blue-600'
                  : isPast
                  ? 'text-gray-500'
                  : 'text-gray-900'
              }
            `}
            >
              {day.format('D')}
            </div>
            <div className="flex-1 space-y-1">
              {dayEvents.slice(0, 3).map((event, index) => {
                const { isStart, isEnd } = getEventPosition(event, dateStr);
                const isMultiDay = !dayjs(event.startDate).isSame(
                  dayjs(event.endDate),
                  'day'
                );

                return (
                  <div
                    key={event.id}
                    className={`
                      text-xs p-1 rounded truncate relative
                      ${
                        event.isAllDay
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }
                      ${isMultiDay ? 'font-medium' : ''}
                      ${onEventClick ? 'cursor-pointer hover:opacity-80' : ''}
                    `}
                    title={`${event.title}${
                      isMultiDay
                        ? ` (${
                            isStart ? 'Starts' : isEnd ? 'Ends' : 'Continues'
                          })`
                        : ''
                    }`}
                    onClick={e => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {isMultiDay && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-60 rounded-l"></span>
                    )}
                    <span className={isMultiDay ? 'ml-1' : ''}>
                      {event.title}
                    </span>
                    {isMultiDay && (
                      <span className="ml-1 text-xs opacity-70">
                        {isStart ? '→' : isEnd ? '←' : '↔'}
                      </span>
                    )}
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  const renderCalendarHeader = () => {
    return (
      <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading calendar: {error}</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Calendar View - Next 30 Days
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on any date to create a new event
          </p>
        </div>
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
            Get started by clicking on a date to create a new event.
          </p>
        </div>
        <div className="overflow-hidden">
          {renderCalendarHeader()}
          <div className="grid grid-cols-7 gap-0">{renderCalendarGrid()}</div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
              <span className="text-gray-600">All Day Events</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
              <span className="text-gray-600">Timed Events</span>
            </div>
          </div>
        </div>
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          onCreateEvent={handleCreateEvent}
          preselectedDate={selectedDate}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Calendar View - Next 30 Days
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Click on any date to create a new event
        </p>
      </div>

      <div className="overflow-hidden">
        {renderCalendarHeader()}
        <div className="grid grid-cols-7 gap-0">{renderCalendarGrid()}</div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
            <span className="text-gray-600">All Day Events</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
            <span className="text-gray-600">Timed Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Multi-day:</span>
            <span className="text-xs">→ Start</span>
            <span className="text-xs">↔ Continue</span>
            <span className="text-xs">← End</span>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onCreateEvent={handleCreateEvent}
        preselectedDate={selectedDate}
      />
    </div>
  );
};

export default CalendarView;
