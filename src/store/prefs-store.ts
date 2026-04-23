import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

// §5.5 "Dual-path rendering": the `presentationMode` slot lets the visitor
// (or a Shift+Enter keypress) bias the dock routing between the diegetic
// (Html transform on the object surface) and panel (2D PanelFrame) forms.
// `auto` is the default — the scene follows the §5.5 triggers
// (reduced-motion, narrow viewport, screen reader, explicit Shift+Enter).
export type PresentationMode = 'auto' | 'diegetic' | 'panel';
const PRESENTATION_MODES: readonly PresentationMode[] = [
  'auto',
  'diegetic',
  'panel',
];
const isPresentationMode = (v: unknown): v is PresentationMode =>
  typeof v === 'string' &&
  (PRESENTATION_MODES as readonly string[]).includes(v);

export interface Prefs {
  reducedMotion: boolean;
  webcamOptIn: boolean;
  deviceOrientationOptIn: boolean;
  hasSeenIntro: boolean;
  presentationMode: PresentationMode;
  setWebcamOptIn: (v: boolean) => void;
  setDeviceOrientationOptIn: (v: boolean) => void;
  dismissIntro: () => void;
  setPresentationMode: (v: PresentationMode) => void;
}

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';
const KEY_WEBCAM = 'atelier:prefs:webcamOptIn';
const KEY_DEVICE_ORIENTATION = 'atelier:prefs:deviceOrientationOptIn';
const KEY_INTRO = 'atelier:prefs:hasSeenIntro';
const KEY_PRESENTATION = 'atelier:prefs:presentationMode';

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

const readPresentationMode = (): PresentationMode => {
  if (typeof localStorage === 'undefined') return 'auto';
  try {
    const raw = localStorage.getItem(KEY_PRESENTATION);
    return isPresentationMode(raw) ? raw : 'auto';
  } catch {
    return 'auto';
  }
};

const writePresentationMode = (v: PresentationMode): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY_PRESENTATION, v);
  } catch {
    /* best-effort */
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
  presentationMode: readPresentationMode(),

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

  setPresentationMode: (v) => {
    if (!isPresentationMode(v)) return; // runtime guard — ignore invalid input
    writePresentationMode(v);
    set({ presentationMode: v });
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
