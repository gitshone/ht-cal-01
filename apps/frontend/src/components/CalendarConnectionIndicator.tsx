import React from 'react';
import { CalendarConnectionStatus } from '../hooks/useCalendarConnection';
import StatusIndicator from './StatusIndicator';

interface CalendarConnectionIndicatorProps {
  connectionStatus: CalendarConnectionStatus;
  onClose?: () => void;
}

const CalendarConnectionIndicator: React.FC<
  CalendarConnectionIndicatorProps
> = ({ connectionStatus, onClose }) => {
  const getTitle = () => {
    switch (connectionStatus.status) {
      case 'pending':
        return 'Starting connection...';
      case 'processing':
        return 'Connecting calendar...';
      case 'completed':
        return 'Calendar connected!';
      case 'failed':
        return 'Connection failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <StatusIndicator
      status={connectionStatus}
      title={getTitle()}
      onClose={onClose}
      showCloseOnCompleted={true}
    >
      {/* Custom content for calendar connection results */}
      {connectionStatus.status === 'completed' && connectionStatus.result && (
        <div className="mt-2 text-xs text-gray-600">
          {'synced' in connectionStatus.result &&
            typeof connectionStatus.result.synced === 'number' && (
              <p>Synced {connectionStatus.result.synced} events</p>
            )}
        </div>
      )}

      {connectionStatus.status === 'failed' && connectionStatus.error && (
        <div className="mt-2 text-xs text-red-600">
          <p className="font-medium">Error:</p>
          <p>{connectionStatus.error}</p>
        </div>
      )}
    </StatusIndicator>
  );
};

export default CalendarConnectionIndicator;
