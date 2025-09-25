import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CalendarViewType = 'day' | 'week' | 'month' | 'year';
export type EventFilterType = 'all' | 'google' | 'microsoft' | 'zoom';

export interface CalendarSettingsState {
  viewType: CalendarViewType;
  providerFilter: EventFilterType;
  showWeekends: boolean;
  searchQuery: string;
  currentDate: string; // ISO string
}

const initialState: CalendarSettingsState = {
  viewType: 'week',
  providerFilter: 'all',
  showWeekends: true,
  searchQuery: '',
  currentDate: new Date().toISOString(),
};

const calendarSettingsSlice = createSlice({
  name: 'calendarSettings',
  initialState,
  reducers: {
    setViewType: (state, action: PayloadAction<CalendarViewType>) => {
      state.viewType = action.payload;
    },
    setProviderFilter: (state, action: PayloadAction<EventFilterType>) => {
      state.providerFilter = action.payload;
    },
    setShowWeekends: (state, action: PayloadAction<boolean>) => {
      state.showWeekends = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCurrentDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },
    resetCalendarSettings: () => initialState,
  },
});

export const {
  setViewType,
  setProviderFilter,
  setShowWeekends,
  setSearchQuery,
  setCurrentDate,
  resetCalendarSettings,
} = calendarSettingsSlice.actions;

export default calendarSettingsSlice.reducer;
