import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'list' | 'calendar';

interface ViewTypeState {
  viewType: ViewType;
  setViewType: (viewType: ViewType) => void;
}

export const useViewTypeStore = create<ViewTypeState>()(
  persist(
    set => ({
      viewType: 'list',
      setViewType: (viewType: ViewType) => set({ viewType }),
    }),
    {
      name: 'view-type-store',
    }
  )
);
