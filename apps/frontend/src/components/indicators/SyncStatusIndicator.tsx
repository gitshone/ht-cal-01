import React from 'react';
import { SyncStatus } from '../../hooks/useSyncStatus';
import StatusIndicator from './StatusIndicator';

interface SyncStatusIndicatorProps {
  syncStatus: SyncStatus;
  onClose?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncStatus,
  onClose,
}) => {
  const getTitle = () => {
    switch (syncStatus.status) {
      case 'pending':
        return 'Sync Starting...';
      case 'processing':
        return 'Syncing Events...';
      case 'completed':
        return 'Sync Completed';
      case 'failed':
        return 'Sync Failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <StatusIndicator status={syncStatus} title={getTitle()} onClose={onClose}>
      {syncStatus.error && syncStatus.status === 'failed' && (
        <div className="mt-2 text-xs text-red-600">
          <p className="font-medium">Error:</p>
          <p>{syncStatus.error}</p>
        </div>
      )}
    </StatusIndicator>
  );
};

export default SyncStatusIndicator;
