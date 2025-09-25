import React, { useMemo, useState, memo } from 'react';
import dayjs from 'dayjs';
import { Event } from '@ht-cal-01/shared-types';
import { timezoneService } from '../../services/timezone.service';
import EventOverflowModal from './EventOverflowModal';

interface MonthViewProps {
  date: dayjs.Dayjs;
  events: { [key: string]: Event[] };
  onEventClick: (event: Event) => void;
  onDateClick: (date: string) => void;
  showWeekends: boolean;
  userTimezone?: string;
}

const MonthView: React.FC<MonthViewProps> = memo(
  ({ date, events, onEventClick, onDateClick, showWeekends, userTimezone }) => {
    const [overflowModal, setOverflowModal] = useState<{
      isOpen: boolean;
      date: dayjs.Dayjs;
      events: Event[];
      position: { top: number; left: number };
    }>({
      isOpen: false,
      date: dayjs(),
      events: [],
      position: { top: 0, left: 0 },
    });

    const startOfMonth = date.startOf('month');
    const endOfMonth = date.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const allDays = [];
    let currentDay = startOfWeek;
    while (currentDay.isSameOrBefore(endOfWeek, 'day')) {
      allDays.push(currentDay);
      currentDay = currentDay.add(1, 'day');
    }

    const days = showWeekends
      ? allDays
      : allDays.filter(day => day.day() !== 0 && day.day() !== 6);

    const today = dayjs();
    const processedEvents = useMemo(() => {
      const processed: { [key: string]: Event[] } = {};

      days.forEach(day => {
        const dateKey = day.format('YYYY-MM-DD');
        processed[dateKey] = [];
      });

      Object.keys(events).forEach(dateKey => {
        if (processed[dateKey] !== undefined) {
          processed[dateKey] = [...events[dateKey]];
        }
      });

      return { processed };
    }, [events, days]);

    const gridCols = showWeekends ? 'grid-cols-7' : 'grid-cols-5';

    const handleOverflowClick = (
      day: dayjs.Dayjs,
      dayEvents: Event[],
      event: React.MouseEvent
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setOverflowModal({
        isOpen: true,
        date: day,
        events: dayEvents,
        position: {
          top: rect.bottom + 4,
          left: rect.left,
        },
      });
    };

    const closeOverflowModal = () => {
      setOverflowModal({
        isOpen: false,
        date: dayjs(),
        events: [],
        position: { top: 0, left: 0 },
      });
    };

    return (
      <>
        <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden">
          <div
            className={`grid ${gridCols} bg-gray-50 border-b border-gray-200`}
          >
            {days.slice(0, showWeekends ? 7 : 5).map((day, index) => (
              <div
                key={index}
                className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
              >
                {day.format('ddd')}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className={`grid ${gridCols} h-full`}>
              {days.map((day, index) => {
                const dateKey = day.format('YYYY-MM-DD');
                const dayEvents = processedEvents.processed[dateKey] || [];
                const isCurrentMonth = day.isSame(date, 'month');
                const isToday = day.isSame(today, 'day');

                return (
                  <div
                    key={index}
                    className={`border-r border-b border-gray-200 p-1 min-h-[120px] ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${
                      isToday ? 'bg-blue-50' : ''
                    } hover:bg-gray-50 cursor-pointer transition-colors`}
                    onClick={() => onDateClick(dateKey)}
                  >
                    <div className="h-6 mb-1 px-1 flex items-center justify-start">
                      <div
                        className={`text-sm font-medium ${
                          isCurrentMonth
                            ? isToday
                              ? 'text-blue-600 font-bold bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center'
                              : 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {day.format('D')}
                      </div>
                    </div>

                    <div className="space-y-0.5 mt-2">
                      {dayEvents.slice(0, 3).map((event, eventIndex) => {
                        const isAllDay = event.isAllDay;
                        const eventStart = timezoneService.fromUTC(
                          event.startDate
                        );
                        const eventEnd = timezoneService.fromUTC(event.endDate);
                        const isMultiDay = !eventStart.isSame(eventEnd, 'day');

                        const timeStr = !isAllDay
                          ? timezoneService.formatTime(event.startDate)
                          : '';

                        const getEventColors = () => {
                          switch (event.providerType) {
                            case 'google':
                              return {
                                bg: isAllDay
                                  ? isMultiDay
                                    ? 'bg-blue-200'
                                    : 'bg-blue-100'
                                  : '',
                                text: 'text-blue-800',
                                hover: isAllDay
                                  ? 'hover:bg-blue-200'
                                  : 'hover:bg-gray-200',
                              };
                            case 'microsoft':
                              return {
                                bg: isAllDay
                                  ? isMultiDay
                                    ? 'bg-green-200'
                                    : 'bg-green-100'
                                  : '',
                                text: 'text-green-800',
                                hover: isAllDay
                                  ? 'hover:bg-green-200'
                                  : 'hover:bg-gray-200',
                              };
                            case 'zoom':
                              return {
                                bg: isAllDay
                                  ? isMultiDay
                                    ? 'bg-purple-200'
                                    : 'bg-purple-100'
                                  : '',
                                text: 'text-purple-800',
                                hover: isAllDay
                                  ? 'hover:bg-purple-200'
                                  : 'hover:bg-gray-200',
                              };
                            default:
                              return {
                                bg: isAllDay
                                  ? isMultiDay
                                    ? 'bg-gray-200'
                                    : 'bg-gray-100'
                                  : '',
                                text: 'text-gray-800',
                                hover: isAllDay
                                  ? 'hover:bg-gray-200'
                                  : 'hover:bg-gray-200',
                              };
                          }
                        };

                        const colors = getEventColors();

                        return (
                          <div
                            key={`${event.id}-${dateKey}`}
                            className={`text-xs cursor-pointer transition-all duration-200 font-normal rounded-sm px-1 py-0.5 ${colors.bg} ${colors.text} ${colors.hover}`}
                            onClick={e => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                          >
                            <div className="flex items-center gap-1">
                              {!isAllDay && (
                                <span className="text-gray-500 font-mono text-xs flex-shrink-0">
                                  {timeStr}
                                </span>
                              )}
                              <span className="truncate font-medium">
                                {event.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleOverflowClick(day, dayEvents, e);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 hover:bg-blue-50 rounded transition-colors"
                        >
                          +{dayEvents.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <EventOverflowModal
          isOpen={overflowModal.isOpen}
          onClose={closeOverflowModal}
          date={overflowModal.date}
          events={overflowModal.events}
          onEventClick={onEventClick}
          position={overflowModal.position}
          visibleEventCount={3}
        />
      </>
    );
  }
);

MonthView.displayName = 'MonthView';

export default MonthView;
