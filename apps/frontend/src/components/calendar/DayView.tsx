import React, { memo, useState } from 'react';
import dayjs from 'dayjs';
import { Event } from '@ht-cal-01/shared-types';
import { timezoneService } from '../../services/timezone.service';

interface DayViewProps {
  date: dayjs.Dayjs;
  events: { [key: string]: Event[] };
  onEventClick: (event: Event) => void;
  onDateClick: (date: string) => void;
  onCreateEvent?: (date: string, time?: string) => void;
}

const DayView: React.FC<DayViewProps> = memo(
  ({ date, events, onEventClick, onDateClick, onCreateEvent }) => {
    const is24Hour = false;

    const [overflowModal, setOverflowModal] = useState<{
      isOpen: boolean;
      timeSlot: string;
      events: Event[];
      position: { top: number; left: number };
    }>({
      isOpen: false,
      timeSlot: '',
      events: [],
      position: { top: 0, left: 0 },
    });

    const currentDateKey = date.format('YYYY-MM-DD');
    const dayEvents = events[currentDateKey] || [];

    const timeSlots = Array.from({ length: 24 }, (_, hour) => {
      const timeSlot = dayjs().hour(hour).minute(0);
      return {
        time: timeSlot,
        label: is24Hour ? timeSlot.format('HH:mm') : timeSlot.format('h:mm A'),
        hour: hour,
      };
    });

    const eventsByTimeSlot: { [key: string]: Event[] } = {};
    const allDayEvents: Event[] = [];

    timeSlots.forEach(slot => {
      eventsByTimeSlot[slot.label] = [];
    });
    dayEvents.forEach(event => {
      if (event.isAllDay) {
        allDayEvents.push(event);
      } else {
        const eventStart = timezoneService.fromUTC(event.startDate);
        const eventHour = eventStart.hour();
        const eventMinute = eventStart.minute();

        const roundedHour = eventMinute >= 30 ? eventHour + 1 : eventHour;
        const slotHour =
          roundedHour >= 24 ? 23 : roundedHour < 0 ? 0 : roundedHour;

        const timeSlot = dayjs().hour(slotHour).minute(0);
        const slotLabel = is24Hour
          ? timeSlot.format('HH:mm')
          : timeSlot.format('h:mm A');

        if (eventsByTimeSlot[slotLabel]) {
          eventsByTimeSlot[slotLabel].push(event);
        }
      }
    });

    const handleOverflowClick = (
      timeSlot: string,
      slotEvents: Event[],
      event: React.MouseEvent
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setOverflowModal({
        isOpen: true,
        timeSlot,
        events: slotEvents,
        position: {
          top: rect.bottom + 4,
          left: rect.left,
        },
      });
    };

    const formatEventTime = (event: Event) => {
      const start = timezoneService.fromUTC(event.startDate);
      const end = timezoneService.fromUTC(event.endDate);

      const startTime = is24Hour
        ? start.format('HH:mm')
        : start.format('h:mm A');
      const endTime = is24Hour ? end.format('HH:mm') : end.format('h:mm A');

      return `${startTime} - ${endTime}`;
    };

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

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {date.format('dddd, MMMM D, YYYY')}
              </h2>
            </div>
            <div className="text-sm text-gray-600">
              {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {allDayEvents.length > 0 && (
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="px-6 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">All Day</h3>
              </div>
              <div className="px-6 py-2">
                <div className="space-y-1">
                  {allDayEvents.map(event => {
                    const colors = getEventColors(event);
                    return (
                      <div
                        key={event.id}
                        className={`text-sm cursor-pointer transition-all duration-200 font-normal rounded-sm px-2 py-1 ${colors.bg} ${colors.text} ${colors.hover}`}
                        onClick={e => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <span className="font-medium">{event.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex">
            <div className="w-20 bg-gray-50 border-r border-gray-200">
              {timeSlots.map(slot => {
                const slotEvents = eventsByTimeSlot[slot.label] || [];
                const eventCount = slotEvents.length;
                const visibleEventCount = Math.min(4, eventCount);
                const hasOverflow = eventCount > 4;
                const height = Math.max(
                  80,
                  16 + visibleEventCount * 40 + 8 + (hasOverflow ? 28 : 0)
                );

                return (
                  <div
                    key={slot.hour}
                    className="border-b border-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium"
                    style={{ height: `${height}px` }}
                  >
                    {slot.label}
                  </div>
                );
              })}
            </div>

            <div className="flex-1">
              {timeSlots.map(slot => {
                const slotEvents = eventsByTimeSlot[slot.label] || [];
                const eventCount = slotEvents.length;
                const visibleEventCount = Math.min(4, eventCount);
                const hasOverflow = eventCount > 4;
                const height = Math.max(
                  80,
                  16 + visibleEventCount * 40 + 8 + (hasOverflow ? 28 : 0)
                );

                return (
                  <div
                    key={slot.hour}
                    className="border-b border-gray-200 px-3 py-2 relative cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ height: `${height}px` }}
                    onClick={() => {
                      if (onCreateEvent) {
                        const timeString = `${slot.hour
                          .toString()
                          .padStart(2, '0')}:00`;
                        onCreateEvent(date.format('YYYY-MM-DD'), timeString);
                      }
                    }}
                  >
                    {slotEvents.length > 0 && (
                      <div className="space-y-1">
                        {slotEvents.slice(0, 4).map(event => {
                          const colors = getEventColors(event);
                          return (
                            <div
                              key={event.id}
                              className={`text-xs cursor-pointer transition-all duration-200 font-normal rounded-sm px-1 py-0.5 ${colors.bg} ${colors.text} ${colors.hover}`}
                              onClick={e => {
                                e.stopPropagation();
                                onEventClick(event);
                              }}
                            >
                              <div className="font-medium truncate">
                                {event.title}
                              </div>
                              <div className="text-xs opacity-75">
                                {formatEventTime(event)}
                              </div>
                            </div>
                          );
                        })}
                        {slotEvents.length > 4 && (
                          <button
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 hover:bg-blue-50 rounded transition-colors"
                            onClick={e => {
                              e.stopPropagation();
                              handleOverflowClick(slot.label, slotEvents, e);
                            }}
                          >
                            +{slotEvents.length - 4} more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {overflowModal.isOpen &&
          (() => {
            const hiddenEvents = overflowModal.events.slice(4);

            const modalWidth = 256;
            const modalHeight = Math.min(
              320,
              16 + hiddenEvents.length * 40 + 8
            );
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let { top, left } = overflowModal.position;

            if (left + modalWidth > viewportWidth) {
              left = viewportWidth - modalWidth - 16;
            }
            if (left < 16) {
              left = 16;
            }

            if (top + modalHeight > viewportHeight) {
              top = overflowModal.position.top - modalHeight - 8;
            }
            if (top < 16) {
              top = 16;
            }

            return (
              <div
                className="fixed inset-0 z-50"
                onClick={() =>
                  setOverflowModal({
                    isOpen: false,
                    timeSlot: '',
                    events: [],
                    position: { top: 0, left: 0 },
                  })
                }
              >
                <div
                  className="absolute bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs w-64 max-h-80 overflow-y-auto"
                  style={{
                    top: `${top}px`,
                    left: `${left}px`,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-3 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">
                      {overflowModal.timeSlot}
                    </h3>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() =>
                        setOverflowModal({
                          isOpen: false,
                          timeSlot: '',
                          events: [],
                          position: { top: 0, left: 0 },
                        })
                      }
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
                            onEventClick(event);
                            setOverflowModal({
                              isOpen: false,
                              timeSlot: '',
                              events: [],
                              position: { top: 0, left: 0 },
                            });
                          }}
                        >
                          <div className="font-medium truncate">
                            {event.title}
                          </div>
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
          })()}
      </div>
    );
  }
);

DayView.displayName = 'DayView';

export default DayView;
