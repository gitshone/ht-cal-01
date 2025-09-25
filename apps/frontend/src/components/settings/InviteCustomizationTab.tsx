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
        setFieldErrors({ logoUpload: errorMessage });
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
        setFieldErrors({ logoUpload: errorMessage });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Meeting Availability */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Meeting Availability
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Control whether people can book new meetings with you
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveMeetingSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>

        <div className="flex items-start space-x-4">
          <div className="flex items-center h-6">
            <button
              type="button"
              onClick={() => setAcceptsNewMeetings(!acceptsNewMeetings)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                acceptsNewMeetings ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  acceptsNewMeetings ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex-1">
            <label
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() => setAcceptsNewMeetings(!acceptsNewMeetings)}
            >
              Accept new meeting requests
            </label>
            <p className="text-sm text-gray-600 mt-1">
              Allow people to book meetings with you through your public
              calendar page.
            </p>
            {!acceptsNewMeetings && (
              <div className="flex items-start space-x-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Meeting requests disabled
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    People won't be able to book new meetings with you when this
                    is disabled.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Header Settings
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Customize your booking page header and branding
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveHeaderSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Header
              </>
            )}
          </button>
        </div>

        {/* General Error Display */}
        {getFieldError('general') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{getFieldError('general')}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Page Title
            </label>
            <input
              type="text"
              value={inviteTitle}
              onChange={e => setInviteTitle(e.target.value)}
              placeholder="e.g., Book a meeting with John Doe"
              className={getFieldClassName(
                'inviteTitle',
                'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
              )}
            />
            {getFieldError('inviteTitle') && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{getFieldError('inviteTitle')}</span>
              </div>
            )}
            <p className="text-sm text-gray-600">
              This title will appear at the top of your booking page
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={inviteDescription}
              onChange={e => setInviteDescription(e.target.value)}
              placeholder="Brief description of what the meeting is about..."
              rows={3}
              className={getFieldClassName(
                'inviteDescription',
                'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none'
              )}
            />
            {getFieldError('inviteDescription') && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{getFieldError('inviteDescription')}</span>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Provide context about the meeting to help people understand what
              to expect
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
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
              {getFieldError('logoUpload') && (
                <div className="flex items-center space-x-2 mt-3 text-sm text-red-600">
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
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{getFieldError('logo')}</span>
                </div>
              )}
              {settings.inviteLogoUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleLogoDelete}
                    disabled={
                      uploadLogoMutation.isPending ||
                      deleteLogoMutation.isPending
                    }
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {deleteLogoMutation.isPending
                      ? 'Deleting...'
                      : 'Remove logo'}
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Upload a logo to personalize your booking page. Recommended size:
              200x200px
            </p>
          </div>
        </div>
      </div>

      {/* Meeting Durations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Available Meeting Durations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select which meeting durations you want to offer
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveDurations}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Durations
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableDurationOptions.map(duration => (
            <label
              key={duration.value}
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            >
              <input
                type="checkbox"
                checked={availableDurations.includes(duration.value)}
                onChange={e =>
                  handleDurationChange(duration.value, e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-700">
                  {duration.label}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {duration.value < 60
                    ? `${duration.value} minutes`
                    : `${duration.value / 60} hour${
                        duration.value > 60 ? 's' : ''
                      }`}
                </p>
              </div>
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
