import { useCallback } from 'react';
import { useAppDispatch } from './redux';
import { addToast } from '../store/slices/toastSlice';
import {
  ValidationError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  ServerError,
  OfflineError,
  isApiError,
  isValidationError,
  isAuthenticationError,
} from '../lib/api/errors';

export const useErrorHandler = () => {
  const dispatch = useAppDispatch();

  const handleError = useCallback(
    (error: any, context?: string) => {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error);

      if (isApiError(error)) {
        switch (error.constructor) {
          case ValidationError:
            if (isValidationError(error) && error.fieldErrors) {
              Object.entries(error.fieldErrors).forEach(([field, message]) => {
                dispatch(
                  addToast({
                    type: 'error',
                    title: 'Validation Error',
                    message: `${field}: ${message}`,
                    duration: 5000,
                  })
                );
              });
            } else {
              dispatch(
                addToast({
                  type: 'error',
                  title: 'Validation Error',
                  message: error.message,
                  duration: 5000,
                })
              );
            }
            break;

          case AuthenticationError:
            if (isAuthenticationError(error)) {
              console.warn('Authentication error - redirecting to login');
            }
            break;

          case NetworkError:
            dispatch(
              addToast({
                type: 'error',
                title: 'Network Error',
                message: 'Please check your internet connection and try again.',
                duration: 7000,
              })
            );
            break;

          case TimeoutError:
            dispatch(
              addToast({
                type: 'error',
                title: 'Request Timeout',
                message: 'The request took too long. Please try again.',
                duration: 5000,
              })
            );
            break;

          case ServerError:
            dispatch(
              addToast({
                type: 'error',
                title: 'Server Error',
                message:
                  'Something went wrong on our end. Please try again later.',
                duration: 7000,
              })
            );
            break;

          case OfflineError:
            dispatch(
              addToast({
                type: 'warning',
                title: 'You are offline',
                message:
                  'Some features may not be available. Requests will be queued.',
                duration: 10000,
              })
            );
            break;

          default:
            dispatch(
              addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'An unexpected error occurred',
                duration: 5000,
              })
            );
        }
      } else if (error instanceof Error) {
        dispatch(
          addToast({
            type: 'error',
            title: 'Error',
            message: error.message || 'An unexpected error occurred',
            duration: 5000,
          })
        );
      } else {
        dispatch(
          addToast({
            type: 'error',
            title: 'Error',
            message: 'An unexpected error occurred',
            duration: 5000,
          })
        );
      }
    },
    [dispatch]
  );

  const handleSuccess = useCallback(
    (message: string, title = 'Success') => {
      dispatch(
        addToast({
          type: 'success',
          title,
          message,
          duration: 3000,
        })
      );
    },
    [dispatch]
  );

  const handleWarning = useCallback(
    (message: string, title = 'Warning') => {
      dispatch(
        addToast({
          type: 'warning',
          title,
          message,
          duration: 5000,
        })
      );
    },
    [dispatch]
  );

  const handleInfo = useCallback(
    (message: string, title = 'Info') => {
      dispatch(
        addToast({
          type: 'info',
          title,
          message,
          duration: 4000,
        })
      );
    },
    [dispatch]
  );

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
  };
};

export const useAsyncOperation = () => {
  const { handleError, handleSuccess } = useErrorHandler();

  const execute = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options: {
        onSuccess?: (result: T) => void;
        onError?: (error: any) => void;
        successMessage?: string;
        context?: string;
      } = {}
    ): Promise<T | null> => {
      try {
        const result = await operation();

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        if (options.successMessage) {
          handleSuccess(options.successMessage);
        }

        return result;
      } catch (error) {
        if (options.onError) {
          options.onError(error);
        } else {
          handleError(error, options.context);
        }

        return null;
      }
    },
    [handleError, handleSuccess]
  );

  return { execute };
};

export default useErrorHandler;
