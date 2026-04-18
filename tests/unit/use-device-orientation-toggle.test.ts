// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeviceOrientationToggle } from '@/ui/controls/use-device-orientation-toggle';
import { prefsStore } from '@/store/prefs-store';

const GLOBAL = globalThis as unknown as Record<string, unknown>;
const KEY = 'DeviceOrientationEvent';

const setDOE = (value: unknown): void => {
  GLOBAL[KEY] = value;
};

const resetPrefs = () =>
  prefsStore.setState({
    deviceOrientationOptIn: false,
    webcamOptIn: false,
    reducedMotion: false,
    hasSeenIntro: false,
  });

describe('useDeviceOrientationToggle', () => {
  let originalDOE: unknown;

  beforeEach(() => {
    resetPrefs();
    originalDOE = GLOBAL[KEY];
  });

  afterEach(() => {
    setDOE(originalDOE);
    resetPrefs();
    vi.restoreAllMocks();
  });

  it('unsupported branch when DeviceOrientationEvent is undefined', async () => {
    setDOE(undefined);
    const { result } = renderHook(() => useDeviceOrientationToggle());
    expect(result.current.available).toBe(false);
    let outcome: string = '';
    await act(async () => {
      outcome = await result.current.enable();
    });
    expect(outcome).toBe('unsupported');
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(false);
  });

  it('needs-permission granted path flips opt-in true', async () => {
    setDOE({
      requestPermission: vi.fn(() => Promise.resolve('granted')),
    });
    const { result } = renderHook(() => useDeviceOrientationToggle());
    expect(result.current.needsPermission).toBe(true);
    let outcome: string = '';
    await act(async () => {
      outcome = await result.current.enable();
    });
    expect(outcome).toBe('granted');
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(true);
  });

  it('needs-permission denied path keeps opt-in false', async () => {
    setDOE({
      requestPermission: vi.fn(() => Promise.resolve('denied')),
    });
    const { result } = renderHook(() => useDeviceOrientationToggle());
    let outcome: string = '';
    await act(async () => {
      outcome = await result.current.enable();
    });
    expect(outcome).toBe('denied');
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(false);
  });

  it('no-permission path grants immediately (Android)', async () => {
    setDOE({});
    const { result } = renderHook(() => useDeviceOrientationToggle());
    expect(result.current.needsPermission).toBe(false);
    let outcome: string = '';
    await act(async () => {
      outcome = await result.current.enable();
    });
    expect(outcome).toBe('granted');
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(true);
  });

  it('reduced-motion short-circuits to denied without requesting', async () => {
    prefsStore.setState({ reducedMotion: true });
    const requestPermission = vi.fn(() => Promise.resolve('granted'));
    setDOE({ requestPermission });
    const { result } = renderHook(() => useDeviceOrientationToggle());
    let outcome: string = '';
    await act(async () => {
      outcome = await result.current.enable();
    });
    expect(outcome).toBe('denied');
    expect(requestPermission).not.toHaveBeenCalled();
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(false);
  });

  it('disable() flips opt-in false', () => {
    setDOE({});
    prefsStore.setState({ deviceOrientationOptIn: true });
    const { result } = renderHook(() => useDeviceOrientationToggle());
    expect(result.current.enabled).toBe(true);
    act(() => {
      result.current.disable();
    });
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(false);
  });
});
