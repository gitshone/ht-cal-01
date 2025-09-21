import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { showSuccess, showError } from '../store/slices/toastSlice';
import {
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
  UpdateUserHandleDto,
} from '@ht-cal-01/shared-types';
import {
  useUserSettings,
  useUnavailabilityBlocks,
  useUpdateUserSettings,
  useCreateUnavailabilityBlock,
  useUpdateUnavailabilityBlock,
  useDeleteUnavailabilityBlock,
} from '../hooks/queries/settingsQueries';
import SettingsTabs from './settings/SettingsTabs';
import GeneralTab from './settings/GeneralTab';
import AvailabilityTab from './settings/AvailabilityTab';
import InviteCustomizationTab from './settings/InviteCustomizationTab';
import UnavailabilityBlockModal from './settings/UnavailabilityBlockModal';
import { authService } from '../lib/api';

const SettingsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState<
    'general' | 'availability' | 'invite'
  >('general');
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);

  // React Query hooks
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useUserSettings();
  const {
    data: unavailabilityBlocks,
    isLoading: blocksLoading,
    error: blocksError,
  } = useUnavailabilityBlocks();
  const updateSettingsMutation = useUpdateUserSettings();
  const createBlockMutation = useCreateUnavailabilityBlock();
  const updateBlockMutation = useUpdateUnavailabilityBlock();
  const deleteBlockMutation = useDeleteUnavailabilityBlock();

  const isLoading = settingsLoading || blocksLoading;
  const error = settingsError || blocksError;

  const handleSaveSettings = async (data: UpdateUserSettingsDto) => {
    await updateSettingsMutation.mutateAsync(data);
    dispatch(
      showSuccess({
        title: 'Settings Updated',
        message: 'Your settings have been saved successfully',
      })
    );
  };

  const handleUpdateHandle = async (data: UpdateUserHandleDto) => {
    await authService.updateHandle(data);
    dispatch(
      showSuccess({
        title: 'Handle Updated',
        message: 'Handle updated successfully',
      })
    );
  };

  const handleAddUnavailabilityBlock = async (
    data: CreateUnavailabilityBlockDto
  ) => {
    await createBlockMutation.mutateAsync(data);
    setShowAddBlockModal(false);
    dispatch(
      showSuccess({
        title: 'Block Added',
        message: 'Unavailability block created successfully',
      })
    );
  };

  const handleUpdateUnavailabilityBlock = async (
    id: string,
    data: UpdateUnavailabilityBlockDto
  ) => {
    await updateBlockMutation.mutateAsync({ id, data });
    setEditingBlock(null);
    dispatch(
      showSuccess({
        title: 'Block Updated',
        message: 'Unavailability block updated successfully',
      })
    );
  };

  const handleDeleteUnavailabilityBlock = async (id: string) => {
    try {
      await deleteBlockMutation.mutateAsync(id);
      dispatch(
        showSuccess({
          title: 'Block Deleted',
          message: 'Unavailability block deleted successfully',
        })
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete unavailability block';
      dispatch(showError({ title: 'Delete Failed', message: errorMessage }));
    }
  };

  const handleModalSave = async (
    data: CreateUnavailabilityBlockDto | UpdateUnavailabilityBlockDto
  ) => {
    if (editingBlock) {
      await handleUpdateUnavailabilityBlock(
        editingBlock.id,
        data as UpdateUnavailabilityBlockDto
      );
    } else {
      await handleAddUnavailabilityBlock(data as CreateUnavailabilityBlockDto);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Settings
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{String(error?.message || error)}</p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No settings data available</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your availability and customize your invite page
        </p>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className={activeTab === 'general' ? 'block' : 'hidden'}>
        {user && <GeneralTab user={user} onUpdateHandle={handleUpdateHandle} />}
      </div>

      <div className={activeTab === 'availability' ? 'block' : 'hidden'}>
        <AvailabilityTab
          settings={settings}
          unavailabilityBlocks={unavailabilityBlocks || []}
          onSaveSettings={handleSaveSettings}
          onAddBlock={() => setShowAddBlockModal(true)}
          onEditBlock={setEditingBlock}
          onDeleteBlock={handleDeleteUnavailabilityBlock}
        />
      </div>

      <div className={activeTab === 'invite' ? 'block' : 'hidden'}>
        <InviteCustomizationTab
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      </div>

      {/* Add/Edit Unavailability Block Modal */}
      {(showAddBlockModal || editingBlock) && (
        <UnavailabilityBlockModal
          block={editingBlock}
          onSave={handleModalSave}
          onClose={() => {
            setShowAddBlockModal(false);
            setEditingBlock(null);
          }}
        />
      )}
    </div>
  );
};

export default SettingsList;
