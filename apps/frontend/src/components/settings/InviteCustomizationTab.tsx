import React, { useState } from 'react';
import { UserSettings, UpdateUserSettingsDto } from '@ht-cal-01/shared-types';
import { ImageUpload } from '../ImageUpload';
import {
  useUploadLogo,
  useDeleteLogo,
} from '../../hooks/queries/settingsQueries';

interface InviteCustomizationTabProps {
  settings: UserSettings;
  onSaveSettings: (data: UpdateUserSettingsDto) => Promise<void>;
}

const availableDurationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const InviteCustomizationTab: React.FC<InviteCustomizationTabProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [inviteTitle, setInviteTitle] = useState(settings.inviteTitle || '');
  const [inviteDescription, setInviteDescription] = useState(
    settings.inviteDescription || ''
  );
  const [availableDurations, setAvailableDurations] = useState(
    settings.availableDurations
  );
  const [acceptsNewMeetings, setAcceptsNewMeetings] = useState(
    settings.acceptsNewMeetings
  );
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // React Query mutations
  const uploadLogoMutation = useUploadLogo();
  const deleteLogoMutation = useDeleteLogo();

  const getFieldError = (fieldName: string) => {
    return fieldErrors[fieldName];
  };

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = fieldErrors[fieldName];
    return `${baseClassName} ${
      hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
    }`;
  };

  const handleSaveHeaderSettings = async () => {
    setIsSaving(true);
    setFieldErrors({});
    try {
      await onSaveSettings({
        inviteTitle,
        inviteDescription,
      });
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
          'Failed to save header settings. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDurations = async () => {
    setIsSaving(true);
    setFieldErrors({});
    try {
      await onSaveSettings({
        availableDurations,
      });
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
          'Failed to save durations. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMeetingSettings = async () => {
    setIsSaving(true);
    setFieldErrors({});
    try {
      await onSaveSettings({
        acceptsNewMeetings,
      });
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
          'Failed to save meeting settings. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDurationChange = (duration: number, checked: boolean) => {
    if (checked) {
      setAvailableDurations(prev => [...prev, duration]);
    } else {
      setAvailableDurations(prev => prev.filter(d => d !== duration));
    }
  };

  const handleLogoUpload = async (file: File) => {
    setFieldErrors({});
    try {
      await uploadLogoMutation.mutateAsync(file);
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
          'Failed to upload logo. Please try again.';
        setFieldErrors({ logo: errorMessage });
      }
    }
  };

  const handleLogoDelete = async () => {
    setFieldErrors({});
    try {
      await deleteLogoMutation.mutateAsync();
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
          'Failed to delete logo. Please try again.';
        setFieldErrors({ logo: errorMessage });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Meeting Availability */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Meeting Availability
          </h2>
          <button
            onClick={handleSaveMeetingSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Control whether people can book new meetings with you.
        </p>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="acceptsNewMeetings"
            checked={acceptsNewMeetings}
            onChange={e => setAcceptsNewMeetings(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="acceptsNewMeetings"
            className="ml-2 text-sm text-gray-700"
          >
            Accept new meeting requests
          </label>
        </div>
        {!acceptsNewMeetings && (
          <p className="text-sm text-amber-600 mt-2">
            When disabled, people won't be able to book new meetings with you.
          </p>
        )}
      </div>

      {/* Header Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Header Settings
          </h2>
          <button
            onClick={handleSaveHeaderSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* General Error Display */}
        {getFieldError('general') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{getFieldError('general')}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={inviteTitle}
              onChange={e => setInviteTitle(e.target.value)}
              placeholder="e.g., Book a meeting with John Doe"
              className={getFieldClassName(
                'inviteTitle',
                'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              )}
            />
            {getFieldError('inviteTitle') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('inviteTitle')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={inviteDescription}
              onChange={e => setInviteDescription(e.target.value)}
              placeholder="Brief description of what the meeting is about..."
              rows={3}
              className={getFieldClassName(
                'inviteDescription',
                'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              )}
            />
            {getFieldError('inviteDescription') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('inviteDescription')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo
            </label>
            <ImageUpload
              onImageSelect={handleLogoUpload}
              currentImage={
                settings.inviteLogoUrl && settings.inviteLogoUrl.trim()
                  ? settings.inviteLogoUrl
                  : undefined
              }
              disabled={
                uploadLogoMutation.isPending || deleteLogoMutation.isPending
              }
              isLoading={uploadLogoMutation.isPending}
            />
            {getFieldError('logo') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('logo')}
              </p>
            )}
            {settings.inviteLogoUrl && (
              <div className="mt-2">
                <button
                  onClick={handleLogoDelete}
                  disabled={
                    uploadLogoMutation.isPending || deleteLogoMutation.isPending
                  }
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deleteLogoMutation.isPending ? 'Deleting...' : 'Remove logo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Durations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Meeting Durations
          </h2>
          <button
            onClick={handleSaveDurations}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* General Error Display */}
        {getFieldError('general') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{getFieldError('general')}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Select which meeting durations you want to offer to people booking
          with you.
        </p>

        <div className="space-y-3">
          {availableDurationOptions.map(duration => (
            <label key={duration.value} className="flex items-center">
              <input
                type="checkbox"
                checked={availableDurations.includes(duration.value)}
                onChange={e =>
                  handleDurationChange(duration.value, e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {duration.label}
              </span>
            </label>
          ))}
        </div>

        {/* Field-specific error display for availableDurations */}
        {getFieldError('availableDurations') && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {getFieldError('availableDurations')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteCustomizationTab;
