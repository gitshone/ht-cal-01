import React, { useState } from 'react';
import {
  UnavailabilityBlock,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
} from '@ht-cal-01/shared-types';
import { TimezoneAwareTimeInput } from '../ui/TimezoneAwareDateTimePicker';
import { timezoneService } from '../../services/timezone.service';

interface UnavailabilityBlockModalProps {
  block?: UnavailabilityBlock | null;
  onSave: (
    data: CreateUnavailabilityBlockDto | UpdateUnavailabilityBlockDto
  ) => Promise<void>;
  onClose: () => void;
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const UnavailabilityBlockModal: React.FC<UnavailabilityBlockModalProps> = ({
  block,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    title: block?.title || '',
    startTime: block?.startTime || '12:00',
    endTime: block?.endTime || '13:00',
    days: block?.days || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      await onSave(formData);
      // Only close modal on success
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
          'Failed to save unavailability block. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {block ? 'Edit Unavailability Block' : 'Add Unavailability Block'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error Display */}
          {getFieldError('general') && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{getFieldError('general')}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Lunch Break"
              className={getFieldClassName(
                'title',
                'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              )}
              required
            />
            {getFieldError('title') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('title')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <TimezoneAwareTimeInput
                value={formData.startTime}
                onChange={value =>
                  setFormData(prev => ({ ...prev, startTime: value }))
                }
                timezone={timezoneService.getCurrentTimezone()}
                className={getFieldClassName(
                  'startTime',
                  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                )}
              />
              {getFieldError('startTime') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('startTime')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <TimezoneAwareTimeInput
                value={formData.endTime}
                onChange={value =>
                  setFormData(prev => ({ ...prev, endTime: value }))
                }
                timezone={timezoneService.getCurrentTimezone()}
                className={getFieldClassName(
                  'endTime',
                  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                )}
              />
              {getFieldError('endTime') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('endTime')}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days
            </label>
            <div className="space-y-2">
              {daysOfWeek.map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.days.includes(key)}
                    onChange={() => handleDayToggle(key)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            {getFieldError('days') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('days')}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : block ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnavailabilityBlockModal;
