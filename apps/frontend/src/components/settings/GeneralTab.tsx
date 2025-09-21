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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Account Information
          </h2>
          <button
            onClick={handleSaveHandle}
            disabled={isSaving || !isHandleChanged || !canChange}
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

        <div className="space-y-6">
          {/* Basic Info (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={user.firstName}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={user.lastName}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handle
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">calendly.com/</span>
              <input
                type="text"
                value={handle}
                onChange={e => setHandle(e.target.value)}
                placeholder="your-handle"
                className={getFieldClassName(
                  'handle',
                  'flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                )}
                disabled={!canChange}
              />
            </div>
            {getFieldError('handle') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('handle')}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Your handle is used for your public booking page. It can only
              contain letters, numbers, underscores, and hyphens.
            </p>
            {!canChange && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-700">
                  You can change your handle once per month. You can change it
                  again in {getDaysUntilNextChange()} days.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
