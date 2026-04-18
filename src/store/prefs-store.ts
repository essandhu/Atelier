import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export interface Prefs {
  reducedMotion: boolean;
  webcamOptIn: boolean;
  deviceOrientationOptIn: boolean;
  hasSeenIntro: boolean;
  setWebcamOptIn: (v: boolean) => void;
  setDeviceOrientationOptIn: (v: boolean) => void;
  dismissIntro: () => void;
}

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';
const KEY_WEBCAM = 'atelier:prefs:webcamOptIn';
const KEY_DEVICE_ORIENTATION = 'atelier:prefs:deviceOrientationOptIn';
const KEY_INTRO = 'atelier:prefs:hasSeenIntro';

const readBoolean = (key: string): boolean => {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

const writeBoolean = (key: string, value: boolean): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* private browsing / disk full — values kept in-memory only */
  }
};

const matchMediaAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

const seedReducedMotion = (): boolean => {
  if (!matchMediaAvailable()) return false;
  try {
    return window.matchMedia(MEDIA_QUERY).matches;
  } catch {
    return false;
  }
};

export const prefsStore = createStore<Prefs>((set) => ({
  reducedMotion: seedReducedMotion(),
  webcamOptIn: readBoolean(KEY_WEBCAM),
  deviceOrientationOptIn: readBoolean(KEY_DEVICE_ORIENTATION),
  hasSeenIntro: readBoolean(KEY_INTRO),

  setWebcamOptIn: (v) => {
    writeBoolean(KEY_WEBCAM, v);
    set({ webcamOptIn: v });
  },

  setDeviceOrientationOptIn: (v) => {
    writeBoolean(KEY_DEVICE_ORIENTATION, v);
    set({ deviceOrientationOptIn: v });
  },

  dismissIntro: () => {
    writeBoolean(KEY_INTRO, true);
    set({ hasSeenIntro: true });
  },
}));

/**
 * Attach a matchMedia listener once per session. Returns a teardown callback.
 * Safe to call on server (no-op).
 */
export const subscribeToReducedMotion = (): (() => void) => {
  if (!matchMediaAvailable()) return () => undefined;
  const mql = window.matchMedia(MEDIA_QUERY);
  const handler = (ev: MediaQueryListEvent | { matches: boolean }): void => {
    prefsStore.setState({ reducedMotion: ev.matches });
  };
  // Seed once more in case the initial seedReducedMotion ran before matchMedia was stubbed.
  prefsStore.setState({ reducedMotion: mql.matches });
  mql.addEventListener('change', handler as (ev: MediaQueryListEvent) => void);
  return () =>
    mql.removeEventListener(
      'change',
      handler as (ev: MediaQueryListEvent) => void,
    );
};

export const usePrefsStore = <T>(selector: (s: Prefs) => T): T =>
  useStore(prefsStore, selector);
