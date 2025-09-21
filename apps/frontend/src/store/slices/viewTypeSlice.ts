import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewType = 'list' | 'calendar';

export interface ViewTypeState {
  viewType: ViewType;
}

const initialState: ViewTypeState = {
  viewType: 'list',
};

const viewTypeSlice = createSlice({
  name: 'viewType',
  initialState,
  reducers: {
    setViewType: (state, action: PayloadAction<ViewType>) => {
      state.viewType = action.payload;
    },
  },
});

export const { setViewType } = viewTypeSlice.actions;
export default viewTypeSlice.reducer;
