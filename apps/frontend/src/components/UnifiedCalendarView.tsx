import React, { useState, useMemo, useEffect } from 'react';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '../hooks/queries/events-queries';
import { useUserSettings } from '../hooks/queries/settingsQueries';
import { timezoneService } from '../services/timezone.service';
import { Event, CalendarViewType } from '@ht-cal-01/shared-types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import EventModal from './modals/EventModal';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { showSuccess, showError } from '../store/slices/toastSlice';
import { useProviderCheck } from '../hooks/useProviderCheck';
import {
  setViewType,
  setProviderFilter,
  setShowWeekends,
  setSearchQuery,
  setCurrentDate,
} from '../store/slices/calendarSettingsSlice';
import { useNavigate } from 'react-router-dom';
import CalendarHeader from './calendar/CalendarHeader';
import DayView from './calendar/DayView';
import WeekView from './calendar/WeekView';
import MonthView from './calendar/MonthView';
import YearView from './calendar/YearView';
import FloatingActionButton from './ui/FloatingActionButton';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface UnifiedCalendarViewProps {
  initialViewType?: CalendarViewType;
  initialDate?: string;
}

const UnifiedCalendarView: React.FC<UnifiedCalendarViewProps> = ({
  initialViewType = 'week',
  initialDate,
}) => {
  const calendarSettings = useAppSelector(state => state.calendarSettings);
  const dispatch = useAppDispatch();

  const viewType = calendarSettings.viewType || initialViewType;
  const providerFilter = calendarSettings.providerFilter || 'all';
  const showWeekends = calendarSettings.showWeekends ?? true;
  const searchQuery = calendarSettings.searchQuery || '';
  const currentDate = useMemo(
    () =>
      calendarSettings.currentDate
        ? dayjs(calendarSettings.currentDate)
        : initialDate
        ? dayjs(initialDate)
        : dayjs(),
    [calendarSettings.currentDate, initialDate]
  );

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null);

  const navigate = useNavigate();
  const { hasConnectedProviders, isLoading: providersLoading } =
    useProviderCheck();

  const { data: userSettings } = useUserSettings();
  const userTimezone = userSettings?.timezone;

  useEffect(() => {
    if (userTimezone) {
      timezoneService.setUserTimezone(userTimezone);
    }
  }, [userTimezone]);

  const { startDate, endDate } = useMemo(() => {
    const start = currentDate.startOf(viewType === 'day' ? 'day' : viewType);
    const end = currentDate.endOf(viewType === 'day' ? 'day' : viewType);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [currentDate, viewType]);

  const {
    data: eventsData,
    isLoading,
    error,
  } = useEvents(
    viewType,
    startDate,
    endDate,
    providerFilter === 'all' ? undefined : providerFilter,
    searchQuery || undefined
  );

  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const groupedEvents = useMemo(() => {
    if (!eventsData?.events) return {};

    const groups: { [key: string]: Event[] } = {};
    eventsData.events.forEach(event => {
      const eventStart = timezoneService.fromUTC(event.startDate);
      const eventEnd = timezoneService.fromUTC(event.endDate);

      const startDate = eventStart.startOf('day');
      const endDate = eventEnd.startOf('day');

      let currentDate = startDate;
      while (currentDate.isSameOrBefore(endDate, 'day')) {
        const dateKey = currentDate.format('YYYY-MM-DD');

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }

        if (!groups[dateKey].find(e => e.id === event.id)) {
          groups[dateKey].push(event);
        }

        currentDate = currentDate.add(1, 'day');
      }
    });

    return groups;
  }, [eventsData?.events]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return groupedEvents;

    const filtered: { [key: string]: Event[] } = {};
    Object.keys(groupedEvents).forEach(dateKey => {
      const dayEvents = groupedEvents[dateKey].filter(
        event =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (event.description &&
            event.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (event.location &&
            event.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      if (dayEvents.length > 0) {
        filtered[dateKey] = dayEvents;
      }
    });

    return filtered;
  }, [groupedEvents, searchQuery]);

  if (providersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!hasConnectedProviders) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <CalendarHeader
          viewType={viewType}
          currentDate={currentDate}
          onViewTypeChange={newViewType => setViewType(newViewType)}
          onPrevious={() =>
            setCurrentDate(
              dayjs(currentDate)
                .subtract(
                  1,
                  viewType === 'day'
                    ? 'day'
                    : viewType === 'week'
                    ? 'week'
                    : 'month'
                )
                .format('YYYY-MM-DD')
            )
          }
          onNext={() =>
            setCurrentDate(
              dayjs(currentDate)
                .add(
                  1,
                  viewType === 'day'
                    ? 'day'
                    : viewType === 'week'
                    ? 'week'
                    : 'month'
                )
                .format('YYYY-MM-DD')
            )
          }
          onToday={() => setCurrentDate(dayjs().format('YYYY-MM-DD'))}
          providerFilter={providerFilter}
          onProviderFilterChange={filter => setProviderFilter(filter)}
          searchQuery={searchQuery}
          onSearchQueryChange={query => setSearchQuery(query)}
          showWeekends={showWeekends}
          onShowWeekendsChange={show => setShowWeekends(show)}
          disabled={true}
        />

        <div className="flex-1 overflow-hidden m-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center px-8">
              <p className="text-lg text-gray-600 mb-8">
                To start using the calendar, connect at least one calendar
                provider. You can connect Google Calendar, Microsoft Outlook, or
                Zoom.
              </p>
              <button
                onClick={() => navigate('/settings?tab=connected-apps')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navigateToPrevious = () => {
    const newDate = currentDate.subtract(
      1,
      viewType === 'day' ? 'day' : viewType
    );
    dispatch(setCurrentDate(newDate.toISOString()));
  };

  const navigateToNext = () => {
    const newDate = currentDate.add(1, viewType === 'day' ? 'day' : viewType);
    dispatch(setCurrentDate(newDate.toISOString()));
  };

  const navigateToToday = () => {
    dispatch(setCurrentDate(dayjs().toISOString()));
  };

  const navigateToMonth = (month: dayjs.Dayjs) => {
    dispatch(setCurrentDate(month.toISOString()));
    dispatch(setViewType('month'));
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      await createEventMutation.mutateAsync(eventData);
      dispatch(
        showSuccess({ title: 'Success', message: 'Event created successfully' })
      );
      setShowModal(false);
    } catch (error: any) {
      if (error?.fieldErrors || error?.response?.data?.fieldErrors) {
        throw error;
      } else {
        dispatch(
          showError({ title: 'Error', message: 'Failed to create event' })
        );
      }
    }
  };

  const handleUpdateEvent = async (eventData: Event) => {
    try {
      await updateEventMutation.mutateAsync({
        id: eventData.id,
        data: {
          title: eventData.title,
          startDate: eventData.startDate.toISOString(),
          endDate: eventData.endDate.toISOString(),
          isAllDay: eventData.isAllDay,
          timezone: eventData.timezone || undefined,
          meetingType:
            (eventData.meetingType as
              | 'video_call'
              | 'phone_call'
              | 'in_person') || undefined,
          description: eventData.description || undefined,
          location: eventData.location || undefined,
          meetingUrl: eventData.meetingUrl || undefined,
          attendees: eventData.attendees || undefined,
        },
      });
      dispatch(
        showSuccess({ title: 'Success', message: 'Event updated successfully' })
      );
      setShowModal(false);
      setSelectedEvent(null);
    } catch (error: any) {
      if (error?.fieldErrors || error?.response?.data?.fieldErrors) {
        throw error;
      } else {
        dispatch(
          showError({ title: 'Error', message: 'Failed to update event' })
        );
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await deleteEventMutation.mutateAsync(selectedEvent.id);
      dispatch(
        showSuccess({ title: 'Success', message: 'Event deleted successfully' })
      );
      setShowModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
      dispatch(
        showError({ title: 'Error', message: 'Failed to delete event' })
      );
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setModalMode('update');
    setShowModal(true);
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setModalMode('create');
    setShowModal(true);
  };

  const handleTimeSlotClick = (date: string, time?: string) => {
    setSelectedDate(date);
    setPreselectedTime(time || null);
    setModalMode('create');
    setShowModal(true);
  };

  const renderCalendarView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">
              <span role="img" aria-label="Warning">
                ⚠️
              </span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Error loading events
            </h3>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </div>
      );
    }

    switch (viewType) {
      case 'day':
        return (
          <DayView
            date={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onCreateEvent={handleTimeSlotClick}
          />
        );
      case 'week':
        return (
          <WeekView
            date={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            showWeekends={showWeekends}
            userTimezone={userTimezone}
          />
        );
      case 'month':
        return (
          <MonthView
            date={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            showWeekends={showWeekends}
            userTimezone={userTimezone}
          />
        );
      case 'year':
        return (
          <YearView
            date={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onNavigateToMonth={navigateToMonth}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <CalendarHeader
        viewType={viewType}
        currentDate={currentDate}
        onViewTypeChange={viewType => dispatch(setViewType(viewType))}
        onPrevious={navigateToPrevious}
        onNext={navigateToNext}
        onToday={navigateToToday}
        providerFilter={providerFilter}
        onProviderFilterChange={filter => dispatch(setProviderFilter(filter))}
        searchQuery={searchQuery}
        onSearchQueryChange={query => dispatch(setSearchQuery(query))}
        showWeekends={showWeekends}
        onShowWeekendsChange={show => dispatch(setShowWeekends(show))}
      />

      {searchQuery && (
        <div className="mx-4 mb-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  Search results for "{searchQuery}"
                </span>
              </div>
              <button
                onClick={() => dispatch(setSearchQuery(''))}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden m-4">{renderCalendarView()}</div>

      {showModal && (
        <EventModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
            setPreselectedTime(null);
          }}
          mode={modalMode}
          event={selectedEvent}
          preselectedDate={selectedDate}
          preselectedTime={preselectedTime}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      <FloatingActionButton
        onClick={() => {
          setModalMode('create');
          setSelectedDate(null);
          setPreselectedTime(null);
          setShowModal(true);
        }}
        disabled={isLoading || providersLoading}
      />
    </div>
  );
};

export default UnifiedCalendarView;
