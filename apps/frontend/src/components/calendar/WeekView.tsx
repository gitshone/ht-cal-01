import React, { useMemo, memo, useState } from 'react';
import dayjs from 'dayjs';
import { Event } from '@ht-cal-01/shared-types';
import { timezoneService } from '../../services/timezone.service';
import EventOverflowModal from './EventOverflowModal';

interface WeekViewProps {
  date: dayjs.Dayjs;
  events: { [key: string]: Event[] };
  onEventClick: (event: Event) => void;
  onDateClick: (date: string) => void;
  showWeekends: boolean;
  userTimezone?: string;
}

const WeekView: React.FC<WeekViewProps> = memo(
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

    const startOfWeek = date.startOf('week');
    const endOfWeek = date.endOf('week');

    const allWeekDays = [];
    let currentDay = startOfWeek;
    while (currentDay.isSameOrBefore(endOfWeek, 'day')) {
      allWeekDays.push(currentDay);
      currentDay = currentDay.add(1, 'day');
    }

    const weekDays = showWeekends
      ? allWeekDays
      : allWeekDays.filter(day => day.day() !== 0 && day.day() !== 6);

    const today = dayjs();
    const processedEvents = useMemo(() => {
      const processed: { [key: string]: Event[] } = {};

      weekDays.forEach(day => {
        const dateKey = day.format('YYYY-MM-DD');
        processed[dateKey] = [];
      });

      Object.keys(events).forEach(dateKey => {
        if (processed[dateKey] !== undefined) {
          processed[dateKey] = [...events[dateKey]];
        }
      });

      return processed;
    }, [events, weekDays]);

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

    const gridCols = showWeekends ? 'grid-cols-7' : 'grid-cols-5';

    return (
      <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden">
        <div className={`grid ${gridCols} bg-gray-50 border-b border-gray-200`}>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              <div>{day.format('ddd')}</div>
              <div
                className={`text-l mt-1 ${
                  day.isSame(today, 'day') ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {day.format('D')}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className={`grid ${gridCols} h-full`}>
            {weekDays.map((day, index) => {
              const dateKey = day.format('YYYY-MM-DD');
              const dayEvents = processedEvents[dateKey] || [];
              const isToday = day.isSame(today, 'day');

              return (
                <div
                  key={index}
                  className={`border-r border-gray-200 p-1 min-h-[400px] ${
                    isToday ? 'bg-blue-50' : 'bg-white'
                  } hover:bg-gray-50 cursor-pointer transition-colors`}
                  onClick={() => onDateClick(dateKey)}
                >
                  <div className="space-y-2">
                    {dayEvents.slice(0, 10).map((event, eventIndex) => {
                      const isAllDay = event.isAllDay;

                      const timeStr = !isAllDay
                        ? timezoneService.formatTime(event.startDate)
                        : '';

                      const getEventColors = () => {
                        switch (event.providerType) {
                          case 'google':
                            return {
                              bg: isAllDay ? 'bg-blue-100' : '',
                              text: 'text-blue-800',
                              border: 'border-blue-500',
                              borderLight: 'border-blue-300',
                              hover: isAllDay
                                ? 'hover:bg-blue-200'
                                : 'hover:bg-gray-200',
                            };
                          case 'microsoft':
                            return {
                              bg: isAllDay ? 'bg-green-100' : '',
                              text: 'text-green-800',
                              border: 'border-green-500',
                              borderLight: 'border-green-300',
                              hover: isAllDay
                                ? 'hover:bg-green-200'
                                : 'hover:bg-gray-200',
                            };
                          case 'zoom':
                            return {
                              bg: isAllDay ? 'bg-purple-100' : '',
                              text: 'text-purple-800',
                              border: 'border-purple-500',
                              borderLight: 'border-purple-300',
                              hover: isAllDay
                                ? 'hover:bg-purple-200'
                                : 'hover:bg-gray-200',
                            };
                          default:
                            return {
                              bg: isAllDay ? 'bg-gray-100' : '',
                              text: 'text-gray-800',
                              border: 'border-gray-500',
                              borderLight: 'border-gray-300',
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
                    {dayEvents.length > 10 && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOverflowClick(day, dayEvents, e);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 hover:bg-blue-50 rounded transition-colors"
                      >
                        +{dayEvents.length - 10} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <EventOverflowModal
          isOpen={overflowModal.isOpen}
          onClose={closeOverflowModal}
          date={overflowModal.date}
          events={overflowModal.events}
          onEventClick={onEventClick}
          position={overflowModal.position}
          visibleEventCount={10}
        />
      </div>
    );
  }
);

WeekView.displayName = 'WeekView';

export default WeekView;
