export type SidebarStore = {
  sidebar: {
    open: boolean;
  };
};

export type SidebarActions = {
  setSidebarOpen: (open: boolean) => void;
};

export const sidebarActions = <T extends SidebarStore>(
  set: (state: Partial<T>) => void,
  get: () => T
) => {
  return {
    setSidebarOpen: (open: boolean) => {
      set({ ...get(), sidebar: { ...get().sidebar, open } });
    },
  };
};
