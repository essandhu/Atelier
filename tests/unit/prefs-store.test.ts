// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MediaQueryListener = (ev: { matches: boolean }) => void;

interface MqlHandle {
  setMatches: (v: boolean) => void;
  listeners: Set<MediaQueryListener>;
}

const installMatchMedia = (initialMatches = false): MqlHandle => {
  const listeners = new Set<MediaQueryListener>();
  let matches = initialMatches;
  const mql = {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_ev: string, cb: MediaQueryListener) => {
      listeners.add(cb);
    },
    removeEventListener: (_ev: string, cb: MediaQueryListener) => {
      listeners.delete(cb);
    },
    dispatchEvent: () => true,
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  // also on window for code that reads window.matchMedia
  (window as unknown as { matchMedia: typeof mql.addEventListener }).matchMedia =
    (() => mql) as unknown as typeof window.matchMedia;

  return {
    setMatches: (v: boolean) => {
      matches = v;
      for (const cb of listeners) cb({ matches });
    },
    listeners,
  };
};

const installLocalStorage = (): Record<string, string> => {
  const store: Record<string, string> = {};
  const ls = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  vi.stubGlobal('localStorage', ls);
  return store;
};

const freshStore = async (): Promise<
  typeof import('@/store/prefs-store')
> => {
  vi.resetModules();
  return import('@/store/prefs-store');
};

describe('prefs-store', () => {
  beforeEach(() => {
    installLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('seeds reducedMotion from matchMedia', async () => {
    installMatchMedia(true);
    const { prefsStore } = await freshStore();
    expect(prefsStore.getState().reducedMotion).toBe(true);
  });

  it('defaults reducedMotion to false when matchMedia is absent', async () => {
    vi.stubGlobal('matchMedia', undefined);
    (window as unknown as { matchMedia: undefined }).matchMedia = undefined;
    const { prefsStore } = await freshStore();
    expect(prefsStore.getState().reducedMotion).toBe(false);
  });

  it('updates reducedMotion when media query changes', async () => {
    const mql = installMatchMedia(false);
    const { prefsStore, subscribeToReducedMotion } = await freshStore();
    const cleanup = subscribeToReducedMotion();
    expect(prefsStore.getState().reducedMotion).toBe(false);
    mql.setMatches(true);
    expect(prefsStore.getState().reducedMotion).toBe(true);
    cleanup();
  });

  it('setWebcamOptIn persists to localStorage', async () => {
    installMatchMedia(false);
    const { prefsStore } = await freshStore();
    prefsStore.getState().setWebcamOptIn(true);
    expect(prefsStore.getState().webcamOptIn).toBe(true);
    expect(localStorage.getItem('atelier:prefs:webcamOptIn')).toBe('true');
  });

  it('dismissIntro sets hasSeenIntro and persists', async () => {
    installMatchMedia(false);
    const { prefsStore } = await freshStore();
    expect(prefsStore.getState().hasSeenIntro).toBe(false);
    prefsStore.getState().dismissIntro();
    expect(prefsStore.getState().hasSeenIntro).toBe(true);
    expect(localStorage.getItem('atelier:prefs:hasSeenIntro')).toBe('true');
  });

  it('reads persisted webcamOptIn on init', async () => {
    installMatchMedia(false);
    localStorage.setItem('atelier:prefs:webcamOptIn', 'true');
    const { prefsStore } = await freshStore();
    expect(prefsStore.getState().webcamOptIn).toBe(true);
  });

  it('setDeviceOrientationOptIn persists to localStorage', async () => {
    installMatchMedia(false);
    const { prefsStore } = await freshStore();
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(false);
    prefsStore.getState().setDeviceOrientationOptIn(true);
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(true);
    expect(localStorage.getItem('atelier:prefs:deviceOrientationOptIn')).toBe(
      'true',
    );
  });

  it('reads persisted deviceOrientationOptIn on init', async () => {
    installMatchMedia(false);
    localStorage.setItem('atelier:prefs:deviceOrientationOptIn', 'true');
    const { prefsStore } = await freshStore();
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(true);
  });

  it('tolerates localStorage throwing (private browsing)', async () => {
    installMatchMedia(false);
    const throwing = {
      getItem: () => {
        throw new Error('nope');
      },
      setItem: () => {
        throw new Error('nope');
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
    vi.stubGlobal('localStorage', throwing);
    const { prefsStore } = await freshStore();
    expect(() => prefsStore.getState().setWebcamOptIn(true)).not.toThrow();
    expect(prefsStore.getState().webcamOptIn).toBe(true);
  });

  // --- P10-08: presentationMode slot ---

  describe('presentationMode', () => {
    it("defaults to 'auto' when no persisted value exists", async () => {
      installMatchMedia(false);
      const { prefsStore } = await freshStore();
      expect(prefsStore.getState().presentationMode).toBe('auto');
    });

    it("round-trips 'diegetic' / 'panel' / 'auto' through localStorage", async () => {
      installMatchMedia(false);
      const { prefsStore } = await freshStore();
      prefsStore.getState().setPresentationMode('diegetic');
      expect(prefsStore.getState().presentationMode).toBe('diegetic');
      expect(localStorage.getItem('atelier:prefs:presentationMode')).toBe(
        'diegetic',
      );
      prefsStore.getState().setPresentationMode('panel');
      expect(localStorage.getItem('atelier:prefs:presentationMode')).toBe(
        'panel',
      );
      prefsStore.getState().setPresentationMode('auto');
      expect(localStorage.getItem('atelier:prefs:presentationMode')).toBe(
        'auto',
      );
    });

    it('reads a persisted presentationMode on init', async () => {
      installMatchMedia(false);
      localStorage.setItem('atelier:prefs:presentationMode', 'panel');
      const { prefsStore } = await freshStore();
      expect(prefsStore.getState().presentationMode).toBe('panel');
    });

    it("rejects an invalid persisted value and falls back to 'auto'", async () => {
      installMatchMedia(false);
      localStorage.setItem('atelier:prefs:presentationMode', 'hologram');
      const { prefsStore } = await freshStore();
      expect(prefsStore.getState().presentationMode).toBe('auto');
    });

    it('setPresentationMode ignores invalid values at runtime', async () => {
      installMatchMedia(false);
      const { prefsStore } = await freshStore();
      // @ts-expect-error — runtime guard under test
      prefsStore.getState().setPresentationMode('invalid');
      expect(prefsStore.getState().presentationMode).toBe('auto');
    });
  });
});
