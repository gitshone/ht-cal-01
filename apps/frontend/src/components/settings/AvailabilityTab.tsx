import React, { useState, useMemo } from 'react';
import {
  UserSettings,
  UnavailabilityBlock,
  DefaultWorkingHours,
  UpdateUserSettingsDto,
} from '@ht-cal-01/shared-types';
import SearchableSelect from '../ui/SearchableSelect';
import { getSupportedTimezones } from '../../utils/timezone';

interface AvailabilityTabProps {
  settings: UserSettings;
  unavailabilityBlocks: UnavailabilityBlock[];
  onSaveSettings: (data: UpdateUserSettingsDto) => Promise<void>;
  onAddBlock: () => void;
  onEditBlock: (block: UnavailabilityBlock) => void;
  onDeleteBlock: (id: string) => void;
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

const AvailabilityTab: React.FC<AvailabilityTabProps> = ({
  settings,
  unavailabilityBlocks,
  onSaveSettings,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
}) => {
  const [workingHours, setWorkingHours] = useState<DefaultWorkingHours>(
    settings.defaultWorkingHours || {}
  );
  const [timezone, setTimezone] = useState(settings.timezone);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const timezoneOptions = useMemo(() => getSupportedTimezones(), []);

  const getFieldError = (fieldName: string) => {
    return fieldErrors[fieldName];
  };

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = fieldErrors[fieldName];
    return `${baseClassName} ${
      hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
    }`;
  };

  const handleWorkingHoursChange = (
    day: string,
    field: 'start' | 'end',
    value: string
  ) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof DefaultWorkingHours],
        [field]: value,
      },
    }));
  };

  const handleSaveWorkingHours = async () => {
    setIsSaving(true);
    setFieldErrors({});
    try {
      await onSaveSettings({ defaultWorkingHours: workingHours });
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
          'Failed to save working hours. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTimezone = async () => {
    setIsSaving(true);
    setFieldErrors({});
    try {
      await onSaveSettings({ timezone });
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
          'Failed to save timezone. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Working Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Default Working Hours
          </h2>
          <button
            onClick={handleSaveWorkingHours}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Set your typical working hours for each day of the week. These will be
          used as your default availability.
        </p>

        {/* General Error Display */}
        {getFieldError('general') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{getFieldError('general')}</p>
          </div>
        )}

        <div className="space-y-4">
          {daysOfWeek.map(({ key, label }) => {
            const dayHours = workingHours[key as keyof DefaultWorkingHours];
            return (
              <div key={key} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium text-gray-700">
                  {label}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={dayHours?.start || '09:00'}
                    onChange={e =>
                      handleWorkingHoursChange(key, 'start', e.target.value)
                    }
                    className={getFieldClassName(
                      `workingHours.${key}.start`,
                      'border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    )}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={dayHours?.end || '17:00'}
                    onChange={e =>
                      handleWorkingHoursChange(key, 'end', e.target.value)
                    }
                    className={getFieldClassName(
                      `workingHours.${key}.end`,
                      'border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timezone */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Timezone</h2>
          <button
            onClick={handleSaveTimezone}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="max-w-md">
          <SearchableSelect
            options={timezoneOptions}
            value={timezone}
            onChange={setTimezone}
            placeholder="Search timezones..."
            className={getFieldClassName('timezone', 'w-full')}
          />
          {getFieldError('timezone') && (
            <p className="mt-1 text-sm text-red-600">
              {getFieldError('timezone')}
            </p>
          )}
        </div>
      </div>

      {/* Unavailability Blocks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Unavailability Blocks
          </h2>
          <button
            onClick={onAddBlock}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Block
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Add blocks of time when you're unavailable, like lunch breaks or
          personal time.
        </p>

        {unavailabilityBlocks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No unavailability blocks set</p>
            <p className="text-sm">
              Click "Add Block" to create your first block
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {unavailabilityBlocks.map(block => (
              <div
                key={block.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{block.title}</h3>
                  <p className="text-sm text-gray-600">
                    {block.startTime} - {block.endTime} •{' '}
                    {block.days
                      .map(day => daysOfWeek.find(d => d.key === day)?.label)
                      .join(', ')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditBlock(block)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteBlock(block.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityTab;
