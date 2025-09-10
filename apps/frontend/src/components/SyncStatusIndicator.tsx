import React from 'react';
import { SyncStatus } from '../hooks/useSyncStatus';
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
      {/* Custom content for sync results */}
      {syncStatus.result && syncStatus.status === 'completed' && (
        <div className="mt-2 text-xs text-gray-600">
          <p>
            Synced:{' '}
            {'synced' in syncStatus.result &&
            typeof syncStatus.result.synced === 'number'
              ? syncStatus.result.synced
              : 0}{' '}
            events
          </p>
          <p>
            Created:{' '}
            {'created' in syncStatus.result &&
            typeof syncStatus.result.created === 'number'
              ? syncStatus.result.created
              : 0}{' '}
            new
          </p>
          <p>
            Updated:{' '}
            {'updated' in syncStatus.result &&
            typeof syncStatus.result.updated === 'number'
              ? syncStatus.result.updated
              : 0}{' '}
            existing
          </p>
        </div>
      )}

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
