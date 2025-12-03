import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { sidebarActions, SidebarActions, SidebarStore } from './sidebar.store';

export type Store = SidebarStore;

export type AppActions = {
  setState: (state: Partial<Store>) => void;
};

export type AppStore = Store & AppActions & SidebarActions;

const initialState: Store = {
  sidebar: {
    open: false,
  },
};

export const createAppStore = (initState: Store = initialState) =>
  createStore<AppStore>()(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          ...initState,
          setState: (state: Partial<Store>) => set({ ...get(), ...state }),
          ...sidebarActions(set, get),
        }),
        {
          name: 'app-store',
          storage: createJSONStorage(() => window.localStorage),
        }
      )
    )
  );
