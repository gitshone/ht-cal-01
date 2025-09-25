import React, { useState, useEffect } from 'react';
import {
  Event,
  CreateEventWithProviderDto,
  UpdateEventDto,
  ProviderType,
} from '@ht-cal-01/shared-types';
import dayjs from 'dayjs';
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '../../hooks/queries/events-queries';
import { useConnectedProviders } from '../../hooks/queries/integrationsQueries';
import { TimezoneAwareDateTimePicker } from '../ui/TimezoneAwareDateTimePicker';
import { EmailListInput } from '../ui/EmailListInput';
import ProviderBadge from '../ui/ProviderBadge';
import LocationSearch from '../ui/LocationSearch';
import PhoneNumberInput from '../ui/PhoneNumberInput';
import { timezoneService } from '../../services/timezone.service';
import ConfirmationModal from './ConfirmationModal';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'update';
  event?: Event | null;
  onCreateEvent?: (eventData: CreateEventWithProviderDto) => Promise<void>;
  onUpdateEvent?: (eventData: Event) => Promise<void>;
  onDeleteEvent?: () => Promise<void>;
  preselectedDate?: string | null;
  preselectedTime?: string | null;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  mode,
  event,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  preselectedDate,
  preselectedTime,
}) => {
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const [formData, setFormData] = useState({
    title: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    startTime: '09:00',
    endDate: dayjs().format('YYYY-MM-DD'),
    endTime: '10:00',
    isAllDay: false,
    providerType: 'google' as ProviderType,
    meetingType: 'video_call' as 'video_call' | 'phone_call' | 'in_person',
    description: '',
    location: '',
    phoneNumber: '',
    attendees: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: connectedProviders = [] } = useConnectedProviders();

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (mode === 'create') {
      const defaultFormData = {
        title: '',
        startDate: preselectedDate || dayjs().format('YYYY-MM-DD'),
        startTime: preselectedTime || dayjs().format('HH:mm'),
        endDate: preselectedDate || dayjs().format('YYYY-MM-DD'),
        endTime: preselectedTime
          ? dayjs(`2000-01-01 ${preselectedTime}`, 'YYYY-MM-DD HH:mm')
              .add(1, 'hour')
              .format('HH:mm')
          : dayjs().add(1, 'hour').format('HH:mm'),
        isAllDay: false,
        providerType: 'google' as ProviderType,
        meetingType: 'video_call' as 'video_call' | 'phone_call' | 'in_person',
        description: '',
        location: '',
        phoneNumber: '',
        attendees: [],
      };
      setFormData(defaultFormData);
    } else if (mode === 'update' && event) {
      const startDate = timezoneService.fromUTC(event.startDate);
      const endDate = timezoneService.fromUTC(event.endDate);

      setFormData({
        title: event.title,
        startDate: startDate.format('YYYY-MM-DD'),
        startTime: event.isAllDay ? '09:00' : startDate.format('HH:mm'),
        endDate: endDate.format('YYYY-MM-DD'),
        endTime: event.isAllDay ? '10:00' : endDate.format('HH:mm'),
        isAllDay: event.isAllDay,
        providerType: (event.providerType as ProviderType) || 'google',
        meetingType:
          (event.meetingType as 'video_call' | 'phone_call' | 'in_person') ||
          'video_call',
        description: event.description || '',
        location: event.location || '',
        phoneNumber: event.meetingUrl || '',
        attendees: (event.attendees as string[]) || [],
      });
    }
    setFieldErrors({});
  }, [isOpen, mode, event, preselectedDate, preselectedTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      if (mode === 'create') {
        const userTimezone = timezoneService.getCurrentTimezone();

        let adjustedEndDate = formData.endDate;
        if (!formData.isAllDay) {
          const startTimeMinutes = dayjs(
            `2000-01-01 ${formData.startTime}`,
            'YYYY-MM-DD HH:mm'
          ).diff(dayjs('2000-01-01 00:00', 'YYYY-MM-DD HH:mm'), 'minute');
          const endTimeMinutes = dayjs(
            `2000-01-01 ${formData.endTime}`,
            'YYYY-MM-DD HH:mm'
          ).diff(dayjs('2000-01-01 00:00', 'YYYY-MM-DD HH:mm'), 'minute');

          if (endTimeMinutes < startTimeMinutes) {
            adjustedEndDate = dayjs(formData.endDate)
              .add(1, 'day')
              .format('YYYY-MM-DD');
          }
        }

        const eventData: CreateEventWithProviderDto = {
          title: formData.title,
          startDate: formData.isAllDay
            ? timezoneService.createLocalDateTime(
                formData.startDate,
                '00:00',
                userTimezone
              )
            : timezoneService.createLocalDateTime(
                formData.startDate,
                formData.startTime,
                userTimezone
              ),
          endDate: formData.isAllDay
            ? timezoneService.createLocalDateTime(
                adjustedEndDate,
                '23:59',
                userTimezone
              )
            : timezoneService.createLocalDateTime(
                adjustedEndDate,
                formData.endTime,
                userTimezone
              ),
          isAllDay: formData.isAllDay,
          providerType: formData.providerType,
          meetingType: formData.meetingType,
          description: formData.description || undefined,
          meetingUrl: getMeetingUrl(),
          location:
            formData.meetingType === 'in_person'
              ? formData.location
              : undefined,
          attendees:
            formData.meetingType === 'video_call'
              ? formData.attendees
              : undefined,
        };

        if (onCreateEvent) {
          await onCreateEvent(eventData);
        } else {
          await createEventMutation.mutateAsync(eventData);
        }
      } else if (mode === 'update' && event) {
        const userTimezone = timezoneService.getCurrentTimezone();

        const updateData: UpdateEventDto = {
          title: formData.title,
          startDate: formData.isAllDay
            ? timezoneService.createLocalDateTime(
                formData.startDate,
                '00:00',
                userTimezone
              )
            : timezoneService.createLocalDateTime(
                formData.startDate,
                formData.startTime,
                userTimezone
              ),
          endDate: formData.isAllDay
            ? timezoneService.createLocalDateTime(
                formData.endDate,
                '23:59',
                userTimezone
              )
            : timezoneService.createLocalDateTime(
                formData.endDate,
                formData.endTime,
                userTimezone
              ),
          isAllDay: formData.isAllDay,
          meetingType: formData.meetingType,
          description: formData.description,
          location: formData.location,
          meetingUrl: getMeetingUrl(),
          attendees:
            formData.meetingType === 'video_call'
              ? formData.attendees
              : undefined,
        };

        if (onUpdateEvent) {
          const eventData: Event = {
            ...event,
            title: updateData.title || event.title,
            startDate: updateData.startDate
              ? new Date(updateData.startDate)
              : event.startDate,
            endDate: updateData.endDate
              ? new Date(updateData.endDate)
              : event.endDate,
            isAllDay:
              updateData.isAllDay !== undefined
                ? updateData.isAllDay
                : event.isAllDay,
            timezone: updateData.timezone || event.timezone,
            meetingType: updateData.meetingType || event.meetingType,
            description: updateData.description || event.description,
            location: updateData.location || event.location,
            meetingUrl: updateData.meetingUrl || event.meetingUrl,
            attendees: updateData.attendees || event.attendees,
          };
          await onUpdateEvent(eventData);
        } else {
          await updateEventMutation.mutateAsync({
            id: event.id,
            data: updateData,
          });
        }
      }

      resetForm();
      onClose();
    } catch (error: unknown) {
      const errorData = error as {
        response?: {
          data?: {
            fieldErrors?: Record<string, string>;
            error?: string;
            message?: string;
          };
        };
        fieldErrors?: Record<string, string>;
        error?: string;
        message?: string;
        cause?: any;
        reason?: any;
      };

      const actualError = errorData.cause || errorData.reason || errorData;

      if (actualError?.fieldErrors) {
        setFieldErrors(actualError.fieldErrors);
      } else if (actualError?.response?.data?.fieldErrors) {
        setFieldErrors(actualError.response.data.fieldErrors);
      } else if (errorData?.fieldErrors) {
        setFieldErrors(errorData.fieldErrors);
      } else if (errorData?.response?.data?.fieldErrors) {
        setFieldErrors(errorData.response.data.fieldErrors);
      } else {
        const errorMessage =
          actualError?.response?.data?.error ||
          actualError?.response?.data?.message ||
          actualError?.error ||
          actualError?.message ||
          errorData?.response?.data?.error ||
          errorData?.response?.data?.message ||
          errorData?.error ||
          errorData?.message ||
          `Failed to ${mode} event. Please try again.`;
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMeetingUrl = () => {
    if (formData.meetingType === 'phone_call' && formData.phoneNumber) {
      return formData.phoneNumber;
    }
    return undefined;
  };

  const handleDelete = () => {
    if (!event) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!event) return;

    setIsSubmitting(true);
    setShowDeleteConfirm(false);

    try {
      if (onDeleteEvent) {
        await onDeleteEvent();
      } else {
        await deleteEventMutation.mutateAsync(event.id);
      }
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete event. Please try again.';
      setFieldErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      startTime: '09:00',
      endDate: dayjs().format('YYYY-MM-DD'),
      endTime: '10:00',
      isAllDay: false,
      providerType: 'google',
      meetingType: 'video_call',
      description: '',
      location: '',
      phoneNumber: '',
      attendees: [],
    });
    setFieldErrors({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getFieldError = (fieldName: string) => {
    return fieldErrors[fieldName];
  };

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = fieldErrors[fieldName];
    return `${baseClassName} ${
      hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
    }`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {mode === 'create' ? 'Create Event' : 'Update Event'}
                  </h3>

                  {mode === 'update' && event && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Event Details
                      </h4>
                      <div className="space-y-2">
                        <ProviderBadge
                          providerType={event.providerType}
                          meetingType={event.meetingType}
                          meetingUrl={event.meetingUrl}
                        />
                        {event.description && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Description:</span>{' '}
                            {event.description}
                          </div>
                        )}
                        {event.meetingUrl && (
                          <div className="text-sm">
                            <a
                              href={event.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Join Meeting
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {getFieldError('general') && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {getFieldError('general')}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          'title',
                          'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                        )}
                        placeholder="Enter event title"
                        required
                      />
                      {getFieldError('title') && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('title')}
                        </p>
                      )}
                    </div>

                    {mode === 'create' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Calendar Provider *
                        </label>
                        <select
                          name="providerType"
                          value={formData.providerType}
                          onChange={handleInputChange}
                          className={getFieldClassName(
                            'providerType',
                            'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          )}
                          required
                        >
                          {connectedProviders.map(provider => (
                            <option
                              key={provider.providerType}
                              value={provider.providerType}
                            >
                              {provider.providerType === 'google' &&
                                'Google Calendar'}
                              {provider.providerType === 'microsoft' &&
                                'Microsoft Teams'}
                              {provider.providerType === 'zoom' && 'Zoom'}
                            </option>
                          ))}
                        </select>
                        {getFieldError('providerType') && (
                          <p className="mt-1 text-sm text-red-600">
                            {getFieldError('providerType')}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Type *
                      </label>
                      <select
                        name="meetingType"
                        value={formData.meetingType}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          'meetingType',
                          'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                        )}
                        required
                      >
                        <option value="video_call">Video Call</option>
                        <option value="phone_call">Phone Call</option>
                        <option value="in_person">In Person</option>
                      </select>
                      {getFieldError('meetingType') && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('meetingType')}
                        </p>
                      )}
                    </div>

                    {formData.meetingType === 'video_call' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-blue-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm text-blue-800">
                            Google will automatically generate a meeting link
                            for this video call.
                          </p>
                        </div>
                      </div>
                    )}

                    {formData.meetingType === 'video_call' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Participants
                        </label>
                        <EmailListInput
                          value={formData.attendees}
                          onChange={attendees =>
                            setFormData(prev => ({ ...prev, attendees }))
                          }
                          placeholder="Add participant email..."
                          maxEmails={50}
                          className={getFieldClassName('attendees', '')}
                          error={getFieldError('attendees')}
                        />
                        {getFieldError('attendees') && (
                          <p className="mt-1 text-sm text-red-600">
                            {getFieldError('attendees')}
                          </p>
                        )}
                      </div>
                    )}

                    {formData.meetingType === 'in_person' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location *
                        </label>
                        <LocationSearch
                          value={formData.location}
                          onChange={location =>
                            setFormData(prev => ({ ...prev, location }))
                          }
                          placeholder="Search for a location..."
                          error={getFieldError('location')}
                        />
                      </div>
                    )}

                    {formData.meetingType === 'phone_call' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <PhoneNumberInput
                          value={formData.phoneNumber}
                          onChange={phoneNumber =>
                            setFormData(prev => ({ ...prev, phoneNumber }))
                          }
                          placeholder="Enter phone number"
                          error={getFieldError('phoneNumber')}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className={getFieldClassName(
                          'description',
                          'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                        )}
                        placeholder="Enter event description"
                      />
                      {getFieldError('description') && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('description')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isAllDay"
                        checked={formData.isAllDay}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        All day event
                      </label>
                    </div>

                    {formData.isAllDay ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className={getFieldClassName(
                              'startDate',
                              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                            )}
                            required
                          />
                          {getFieldError('startDate') && (
                            <p className="mt-1 text-sm text-red-600">
                              {getFieldError('startDate')}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date *
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className={getFieldClassName(
                              'endDate',
                              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                            )}
                            required
                          />
                          {getFieldError('endDate') && (
                            <p className="mt-1 text-sm text-red-600">
                              {getFieldError('endDate')}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Start
                          </div>
                          <TimezoneAwareDateTimePicker
                            value={
                              mode === 'update' && event
                                ? event.startDate.toString()
                                : dayjs
                                    .tz(
                                      `${formData.startDate} ${formData.startTime}`,
                                      timezoneService.getCurrentTimezone()
                                    )
                                    .toISOString()
                            }
                            onChange={value => {
                              const localTime = timezoneService.fromUTC(value);
                              setFormData(prev => ({
                                ...prev,
                                startDate: localTime.format('YYYY-MM-DD'),
                                startTime: localTime.format('HH:mm'),
                              }));
                            }}
                            timezone={timezoneService.getCurrentTimezone()}
                            required
                            showTimezone={false}
                          />
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            End
                          </div>
                          <TimezoneAwareDateTimePicker
                            value={
                              mode === 'update' && event
                                ? event.endDate.toString()
                                : dayjs
                                    .tz(
                                      `${formData.endDate} ${formData.endTime}`,
                                      timezoneService.getCurrentTimezone()
                                    )
                                    .toISOString()
                            }
                            onChange={value => {
                              const localTime = timezoneService.fromUTC(value);
                              setFormData(prev => ({
                                ...prev,
                                endDate: localTime.format('YYYY-MM-DD'),
                                endTime: localTime.format('HH:mm'),
                              }));
                            }}
                            timezone={timezoneService.getCurrentTimezone()}
                            required
                            showTimezone={false}
                          />
                        </div>

                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                          {timezoneService.getCurrentTimezone()} (
                          {timezoneService.getTimezoneOffset(
                            timezoneService.getCurrentTimezone()
                          )}
                          )
                          {!timezoneService.is24HourFormat(
                            timezoneService.getCurrentTimezone()
                          ) && (
                            <span className="ml-2 text-blue-600">
                              • 12-hour format
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Processing...'
                  : mode === 'create'
                  ? 'Create Event'
                  : 'Update Event'}
              </button>

              {mode === 'update' && onDeleteEvent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Event
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${event?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default EventModal;
