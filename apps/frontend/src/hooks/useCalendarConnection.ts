import { useState, useEffect, useCallback } from 'react';
import { webSocketService, SyncUpdateEvent } from '../lib/websocket.service';
import { calendarService } from '../lib/api/calendar.service';
import { WEBSOCKET_EVENTS } from '@ht-cal-01/shared-types';

export interface CalendarConnectionStatus {
  isConnecting: boolean;
  currentJobId: string | null;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

export const useCalendarConnection = () => {
  const [connectionStatus, setConnectionStatus] =
    useState<CalendarConnectionStatus>({
      isConnecting: false,
      currentJobId: null,
      status: 'idle',
      progress: 0,
      message: '',
      result: null,
      error: null,
    });

  const startConnection = useCallback(async (googleCode: string) => {
    try {
      setConnectionStatus(prev => ({
        ...prev,
        isConnecting: true,
        status: 'pending',
        progress: 0,
        message: 'Starting calendar connection...',
        error: null,
      }));

      const response = await calendarService.connectCalendar(googleCode);

      setConnectionStatus(prev => ({
        ...prev,
        currentJobId: response.jobId,
        status: 'pending',
        message: 'Calendar connection started',
      }));
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        isConnecting: false,
        status: 'failed',
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start calendar connection',
        message: 'Failed to start calendar connection',
      }));
    }
  }, []);

  const handleConnectionUpdate = useCallback(
    (event: SyncUpdateEvent) => {
      // Only handle calendar connection events
      if (!event.type.startsWith('calendar_')) {
        return;
      }

      setConnectionStatus(prev => {
        // Check if this is for the current job
        if (prev.currentJobId && event.jobId !== prev.currentJobId) {
          return prev;
        }

        switch (event.type) {
          case WEBSOCKET_EVENTS.CALENDAR_CONNECTION_STARTED:
            return {
              ...prev,
              status: 'processing',
              progress: 10,
              message: event.message || 'Calendar connection started',
            };

          case WEBSOCKET_EVENTS.CALENDAR_CONNECTED:
            return {
              ...prev,
              isConnecting: false,
              status: 'completed',
              progress: 100,
              message: event.message || 'Calendar connected successfully',
              result: event.data || null,
              error: null,
            };

          case WEBSOCKET_EVENTS.CALENDAR_CONNECTION_FAILED:
            return {
              ...prev,
              isConnecting: false,
              status: 'failed',
              message: event.message || 'Calendar connection failed',
              error: event.message || 'Unknown error',
            };

          default:
            return prev;
        }
      });
    },
    [] // Remove dependency on connectionStatus.currentJobId
  );

  const resetConnectionStatus = useCallback(() => {
    setConnectionStatus({
      isConnecting: false,
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
    const unsubscribe = webSocketService.onSyncUpdate(handleConnectionUpdate);
    return unsubscribe;
  }, [handleConnectionUpdate]);

  return {
    connectionStatus,
    startConnection,
    resetConnectionStatus,
  };
};
