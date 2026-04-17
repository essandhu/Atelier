import { createStore } from 'zustand/vanilla';
import type { TimeOfDayState } from '@/time-of-day/types';

interface TimeOfDayStore {
  resolved: TimeOfDayState | null;
  initialize: (state: TimeOfDayState) => void;
  ensureInitialized: () => void;
}

export const timeOfDayStore = createStore<TimeOfDayStore>((set, get) => ({
  resolved: null,
  initialize: (state) => {
    if (get().resolved !== null) {
      throw new Error(
        `time-of-day-store already initialized to '${get().resolved}'; ` +
          `refusing to overwrite with '${state}'`,
      );
    }
    set({ resolved: state });
  },
  ensureInitialized: () => {
    if (get().resolved !== null) return;
    set({ resolved: 'evening' });
  },
}));
