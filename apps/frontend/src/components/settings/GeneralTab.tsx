import React, { useState } from 'react';
import { User, UpdateUserHandleDto } from '@ht-cal-01/shared-types';

interface GeneralTabProps {
  user: User;
  onUpdateHandle: (data: UpdateUserHandleDto) => Promise<void>;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ user, onUpdateHandle }) => {
  const [handle, setHandle] = useState(user.handle || '');
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const getFieldError = (fieldName: string) => {
    return fieldErrors[fieldName];
  };

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = fieldErrors[fieldName];
    return `${baseClassName} ${
      hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
    }`;
  };

  const handleSaveHandle = async () => {
    setIsSaving(true);
    setFieldErrors({});
    try {
      await onUpdateHandle({ handle });
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
          'Failed to update handle. Please try again.';
        setFieldErrors({ general: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const canChangeHandle = () => {
    if (!user.handleUpdatedAt) return true;

    const lastUpdate = new Date(user.handleUpdatedAt);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return lastUpdate < oneMonthAgo;
  };

  const getDaysUntilNextChange = () => {
    if (!user.handleUpdatedAt) return 0;

    const lastUpdate = new Date(user.handleUpdatedAt);
    const nextAllowedDate = new Date(lastUpdate);
    nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1);

    const now = new Date();
    const diffTime = nextAllowedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  const isHandleChanged = handle !== (user.handle || '');
  const canChange = canChangeHandle();

  return (
    <div className="space-y-8">
      {/* Account Information */}
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Account Information
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your account details and preferences
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveHandle}
            disabled={isSaving || !isHandleChanged || !canChange}
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
                Save Changes
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
          {/* Basic Info (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user.firstName}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user.lastName}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Handle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Public Handle
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center px-3 py-3 bg-gray-50 border border-gray-300 rounded-l-lg text-sm text-gray-600 font-medium">
                calendly.com/
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="your-handle"
                  className={getFieldClassName(
                    'handle',
                    'w-full border border-gray-300 rounded-r-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                  )}
                  disabled={!canChange}
                />
                {!canChange && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            {getFieldError('handle') && (
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
                <span>{getFieldError('handle')}</span>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Your handle is used for your public booking page. It can only
              contain letters, numbers, underscores, and hyphens.
            </p>
            {!canChange && (
              <div className="flex items-start space-x-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
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
                    Handle change limit reached
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    You can change your handle once per month. You can change it
                    again in {getDaysUntilNextChange()} days.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
