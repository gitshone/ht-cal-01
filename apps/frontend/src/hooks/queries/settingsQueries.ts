import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../lib/api';
import {
  UserSettings,
  UpdateUserSettingsDto,
  CreateUnavailabilityBlockDto,
  UpdateUnavailabilityBlockDto,
} from '@ht-cal-01/shared-types';

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  userSettings: () => [...settingsKeys.all, 'userSettings'] as const,
  unavailabilityBlocks: () =>
    [...settingsKeys.all, 'unavailabilityBlocks'] as const,
};

// Hooks
export const useUserSettings = () => {
  return useQuery({
    queryKey: settingsKeys.userSettings(),
    queryFn: () => settingsService.getUserSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUnavailabilityBlocks = () => {
  return useQuery({
    queryKey: settingsKeys.unavailabilityBlocks(),
    queryFn: () => settingsService.getUnavailabilityBlocks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSettingsDto) =>
      settingsService.updateUserSettings(data),
    onSuccess: (data: UserSettings) => {
      queryClient.setQueryData(settingsKeys.userSettings(), data);
    },
  });
};

export const useCreateUnavailabilityBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnavailabilityBlockDto) =>
      settingsService.createUnavailabilityBlock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.unavailabilityBlocks(),
      });
    },
  });
};

export const useUpdateUnavailabilityBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUnavailabilityBlockDto;
    }) => settingsService.updateUnavailabilityBlock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.unavailabilityBlocks(),
      });
    },
  });
};

export const useDeleteUnavailabilityBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsService.deleteUnavailabilityBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.unavailabilityBlocks(),
      });
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file),
    onSuccess: (data: UserSettings) => {
      queryClient.setQueryData(settingsKeys.userSettings(), data);
    },
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.userSettings(),
      });
    },
  });
};

export const useDeleteLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsService.deleteLogo(),
    onSuccess: (data: UserSettings) => {
      queryClient.setQueryData(settingsKeys.userSettings(), data);
    },
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.userSettings(),
      });
    },
  });
};
