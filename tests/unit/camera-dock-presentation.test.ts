// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { prefsStore } from '@/store/prefs-store';
import { useDiegeticPresentation } from '@/interaction/camera-dock/presentation';

// Stub matchMedia once per test so the narrow-viewport hook can observe it.
interface MqlHandle {
  setMatches: (v: boolean) => void;
}

const installMatchMedia = (
  initialMatches: Partial<{
    reducedMotion: boolean;
    narrow: boolean;
  }> = {},
): { reducedMotion: MqlHandle; narrow: MqlHandle } => {
  const listenersFor = new Map<string, Set<(e: { matches: boolean }) => void>>();
  const matchesFor = new Map<string, boolean>();
  matchesFor.set(
    '(prefers-reduced-motion: reduce)',
    Boolean(initialMatches.reducedMotion),
  );
  matchesFor.set('(max-width: 480px)', Boolean(initialMatches.narrow));

  const make = (media: string) => ({
    get matches() {
      return matchesFor.get(media) ?? false;
    },
    media,
    addEventListener: (_evt: string, cb: (e: { matches: boolean }) => void) => {
      if (!listenersFor.has(media)) listenersFor.set(media, new Set());
      listenersFor.get(media)!.add(cb);
    },
    removeEventListener: (_evt: string, cb: (e: { matches: boolean }) => void) => {
      listenersFor.get(media)?.delete(cb);
    },
    dispatchEvent: () => true,
  });

  const mqlFor = new Map<string, ReturnType<typeof make>>();
  const getMql = (media: string) => {
    let m = mqlFor.get(media);
    if (!m) {
      m = make(media);
      mqlFor.set(media, m);
    }
    return m;
  };

  const matchMedia = vi.fn((q: string) => getMql(q));
  vi.stubGlobal('matchMedia', matchMedia);
  (window as unknown as { matchMedia: typeof matchMedia }).matchMedia = matchMedia;

  const handleFor = (media: string): MqlHandle => ({
    setMatches: (v: boolean) => {
      matchesFor.set(media, v);
      listenersFor.get(media)?.forEach((cb) => cb({ matches: v }));
    },
  });

  return {
    reducedMotion: handleFor('(prefers-reduced-motion: reduce)'),
    narrow: handleFor('(max-width: 480px)'),
  };
};

describe('useDiegeticPresentation', () => {
  beforeEach(() => {
    prefsStore.setState({
      presentationMode: 'auto',
      reducedMotion: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 'diegetic' on wide, motion-enabled auto mode", () => {
    installMatchMedia({ reducedMotion: false, narrow: false });
    const { result } = renderHook(() => useDiegeticPresentation());
    expect(result.current).toBe('diegetic');
  });

  it("returns 'panel' when presentationMode is explicitly 'panel'", () => {
    installMatchMedia({ reducedMotion: false, narrow: false });
    prefsStore.setState({ presentationMode: 'panel' });
    const { result } = renderHook(() => useDiegeticPresentation());
    expect(result.current).toBe('panel');
  });

  it("returns 'diegetic' when presentationMode is explicitly 'diegetic' (overrides reducedMotion)", () => {
    installMatchMedia({ reducedMotion: true, narrow: false });
    prefsStore.setState({
      presentationMode: 'diegetic',
      reducedMotion: true,
    });
    const { result } = renderHook(() => useDiegeticPresentation());
    expect(result.current).toBe('diegetic');
  });

  it("falls back to 'panel' on auto + reducedMotion", () => {
    installMatchMedia({ reducedMotion: true, narrow: false });
    prefsStore.setState({ reducedMotion: true });
    const { result } = renderHook(() => useDiegeticPresentation());
    expect(result.current).toBe('panel');
  });

  it("falls back to 'panel' on auto + narrow viewport", () => {
    installMatchMedia({ reducedMotion: false, narrow: true });
    const { result } = renderHook(() => useDiegeticPresentation());
    expect(result.current).toBe('panel');
  });
});
