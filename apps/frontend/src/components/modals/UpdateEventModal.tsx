import React, { useState, useEffect } from 'react';
import {
  Event as CalendarEvent,
  UpdateEventDto,
} from '@ht-cal-01/shared-types';
import { eventService } from '../../lib/api/event.service';
import dayjs from 'dayjs';

interface UpdateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEventUpdated: (updatedEvent: CalendarEvent) => void;
  onEventDeleted?: () => void;
}

const UpdateEventModal: React.FC<UpdateEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onEventUpdated,
  onEventDeleted,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    isAllDay: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event && isOpen) {
      const startDate = dayjs(event.startDate);
      const endDate = dayjs(event.endDate);

      setFormData({
        title: event.title,
        startDate: startDate.format('YYYY-MM-DD'),
        startTime: event.isAllDay ? '09:00' : startDate.format('HH:mm'),
        endDate: endDate.format('YYYY-MM-DD'),
        endTime: event.isAllDay ? '10:00' : endDate.format('HH:mm'),
        isAllDay: event.isAllDay,
      });
      setFieldErrors({});
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    if (!event) return;

    try {
      const updateData: UpdateEventDto = {
        title: formData.title,
        startDate: formData.isAllDay
          ? `${formData.startDate}T00:00:00.000Z`
          : `${formData.startDate}T${formData.startTime}:00.000Z`,
        endDate: formData.isAllDay
          ? `${formData.endDate}T23:59:59.999Z`
          : `${formData.endDate}T${formData.endTime}:00.000Z`,
        isAllDay: formData.isAllDay,
      };

      const updatedEvent = await eventService.updateEvent(event.id, updateData);
      onEventUpdated(updatedEvent);
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
      };

      if (errorData?.fieldErrors) {
        setFieldErrors(errorData.fieldErrors);
      } else if (errorData?.response?.data?.fieldErrors) {
        setFieldErrors(errorData.response.data.fieldErrors);
      } else {
        const errorMessage =
          errorData?.response?.data?.error ||
          errorData?.response?.data?.message ||
          errorData?.error ||
          errorData?.message ||
          'Failed to update event. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
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

  const handleDelete = async () => {
    if (!event) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      await eventService.deleteEvent(event.id);
      onClose(); // Close modal after successful deletion
      onEventDeleted?.(); // Notify parent component
    } catch (_error: any) {
      setFieldErrors({ general: 'Failed to delete event. Please try again.' });
    } finally {
      setIsSubmitting(false);
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

  if (!isOpen || !event) return null;

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
                    Update Event
                  </h3>

                  {/* General Error Display */}
                  {getFieldError('general') && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {getFieldError('general')}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          'title',
                          'mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                        )}
                        placeholder="Event title"
                      />
                      {getFieldError('title') && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('title')}
                        </p>
                      )}
                    </div>

                    {/* All Day Toggle */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isAllDay"
                        id="isAllDay"
                        checked={formData.isAllDay}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isAllDay"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        All day event
                      </label>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="startDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          id="startDate"
                          required
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className={getFieldClassName(
                            'startDate',
                            'mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                          )}
                        />
                        {getFieldError('startDate') && (
                          <p className="mt-1 text-sm text-red-600">
                            {getFieldError('startDate')}
                          </p>
                        )}
                      </div>

                      {!formData.isAllDay && (
                        <div>
                          <label
                            htmlFor="startTime"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Start Time *
                          </label>
                          <input
                            type="time"
                            name="startTime"
                            id="startTime"
                            required={!formData.isAllDay}
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className={getFieldClassName(
                              'startTime',
                              'mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                            )}
                          />
                          {getFieldError('startTime') && (
                            <p className="mt-1 text-sm text-red-600">
                              {getFieldError('startTime')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="endDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          End Date *
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          id="endDate"
                          required
                          value={formData.endDate}
                          onChange={handleInputChange}
                          className={getFieldClassName(
                            'endDate',
                            'mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                          )}
                        />
                        {getFieldError('endDate') && (
                          <p className="mt-1 text-sm text-red-600">
                            {getFieldError('endDate')}
                          </p>
                        )}
                      </div>

                      {!formData.isAllDay && (
                        <div>
                          <label
                            htmlFor="endTime"
                            className="block text-sm font-medium text-gray-700"
                          >
                            End Time *
                          </label>
                          <input
                            type="time"
                            name="endTime"
                            id="endTime"
                            required={!formData.isAllDay}
                            value={formData.endTime}
                            onChange={handleInputChange}
                            className={getFieldClassName(
                              'endTime',
                              'mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                            )}
                          />
                          {getFieldError('endTime') && (
                            <p className="mt-1 text-sm text-red-600">
                              {getFieldError('endTime')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Event'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateEventModal;
