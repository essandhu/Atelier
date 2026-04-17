import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { TimeOfDayState } from '@/time-of-day/types';

interface TimeOfDayStore {
  resolved: TimeOfDayState | null;
  initialize: (state: TimeOfDayState) => void;
  ensureInitialized: (state?: TimeOfDayState) => void;
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
  ensureInitialized: (state = 'evening') => {
    if (get().resolved !== null) return;
    set({ resolved: state });
  },
}));

export const useTimeOfDayStore = <T>(
  selector: (s: TimeOfDayStore) => T,
): T => useStore(timeOfDayStore, selector);

export const useResolvedTimeOfDay = (): TimeOfDayState =>
  useTimeOfDayStore((s) => s.resolved ?? 'evening');
