import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { DeviceOrientationToggle } from '@/ui/controls/DeviceOrientationToggle';
import { prefsStore } from '@/store/prefs-store';

const GLOBAL = globalThis as unknown as Record<string, unknown>;
const KEY = 'DeviceOrientationEvent';

const setDOE = (value: unknown): void => {
  GLOBAL[KEY] = value;
};

const mockNarrow = (matches: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches,
      media: '(max-width: 480px)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    })),
  );
};

const resetPrefs = () =>
  prefsStore.setState({
    webcamOptIn: false,
    deviceOrientationOptIn: false,
    hasSeenIntro: false,
    reducedMotion: false,
  });

describe('<DeviceOrientationToggle>', () => {
  let originalDOE: unknown;

  beforeEach(() => {
    resetPrefs();
    originalDOE = GLOBAL[KEY];
  });

  afterEach(() => {
    cleanup();
    setDOE(originalDOE);
    resetPrefs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns null when DeviceOrientationEvent is unsupported', () => {
    setDOE(undefined);
    mockNarrow(true);
    const { container } = render(<DeviceOrientationToggle />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when not narrow and no forceShow', () => {
    setDOE({});
    mockNarrow(false);
    const { container } = render(<DeviceOrientationToggle />);
    expect(container.firstChild).toBeNull();
  });

  it('renders enable label on narrow viewport when off', () => {
    setDOE({});
    mockNarrow(true);
    render(<DeviceOrientationToggle />);
    expect(screen.getByRole('button').textContent).toMatch(/enable/i);
  });

  it('click on off toggle calls enable() → grants → opt-in true', async () => {
    setDOE({});
    mockNarrow(true);
    render(<DeviceOrientationToggle />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(prefsStore.getState().deviceOrientationOptIn).toBe(true);
    });
    expect(screen.getByRole('button').textContent).toMatch(/disable/i);
  });

  it('click on on-state calls disable() → opt-in false', () => {
    setDOE({});
    mockNarrow(true);
    prefsStore.setState({ deviceOrientationOptIn: true });
    render(<DeviceOrientationToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(false);
  });

  it('denied outcome renders inline error copy', async () => {
    setDOE({
      requestPermission: vi.fn(() => Promise.resolve('denied')),
    });
    mockNarrow(true);
    render(<DeviceOrientationToggle />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findByText(/permission denied/i);
    expect(prefsStore.getState().deviceOrientationOptIn).toBe(false);
  });
});
