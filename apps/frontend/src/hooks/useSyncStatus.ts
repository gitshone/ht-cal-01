import { useState, useEffect, useCallback } from 'react';
import { webSocketService, SyncUpdateEvent } from '../lib/websocket.service';
import { eventService } from '../lib/api/event.service';
import { WEBSOCKET_EVENTS } from '@ht-cal-01/shared-types';

export interface SyncStatus {
  isSyncing: boolean;
  currentJobId: string | null;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    currentJobId: null,
    status: 'idle',
    progress: 0,
    message: '',
    result: null,
    error: null,
  });

  const startSync = useCallback(async () => {
    try {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: true,
        status: 'pending',
        progress: 0,
        message: 'Starting sync...',
        error: null,
      }));

      const response = await eventService.startSync();

      setSyncStatus(prev => ({
        ...prev,
        currentJobId: response.jobId,
        status: 'pending',
        message: 'Sync job started',
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start sync',
        message: 'Failed to start sync',
      }));
    }
  }, []);

  const handleSyncUpdate = useCallback((event: SyncUpdateEvent) => {
    if (!event.type.startsWith('sync_')) {
      return;
    }

    setSyncStatus(prev => {
      switch (event.type) {
        case WEBSOCKET_EVENTS.SYNC_STARTED:
          return {
            ...prev,
            status: 'processing',
            progress: 10,
            message: event.message || 'Sync started',
          };

        case WEBSOCKET_EVENTS.SYNC_PROGRESS:
          return {
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
            message: event.message || 'Syncing events...',
          };

        case WEBSOCKET_EVENTS.SYNC_COMPLETED:
          return {
            ...prev,
            isSyncing: false,
            status: 'completed',
            progress: 100,
            message: event.message || 'Sync completed successfully',
            result: event.data || null,
            error: null,
          };

        case WEBSOCKET_EVENTS.SYNC_FAILED:
          return {
            ...prev,
            isSyncing: false,
            status: 'failed',
            message: event.message || 'Sync failed',
            error: event.message || 'Unknown error',
          };

        default:
          return prev;
      }
    });
  }, []);

  const resetSyncStatus = useCallback(() => {
    setSyncStatus({
      isSyncing: false,
      currentJobId: null,
      status: 'idle',
      progress: 0,
      message: '',
      result: null,
      error: null,
    });
  }, []);

  /**
   * Set up WebSocket listener
   */
  useEffect(() => {
    const unsubscribe = webSocketService.onSyncUpdate(handleSyncUpdate);
    return unsubscribe;
  }, [handleSyncUpdate]);

  return {
    syncStatus,
    startSync,
    resetSyncStatus,
  };
};
