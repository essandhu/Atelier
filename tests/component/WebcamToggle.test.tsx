import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { WebcamToggle } from '@/ui/controls/WebcamToggle';
import { prefsStore } from '@/store/prefs-store';
import { webcamStreamStore } from '@/store/webcam-stream-store';
import * as gate from '@/interaction/webcam/gate';

const resetAll = () => {
  prefsStore.setState({
    webcamOptIn: false,
    deviceOrientationOptIn: false,
    hasSeenIntro: false,
    reducedMotion: false,
  });
  webcamStreamStore.setState({ activeStream: null });
};

describe('<WebcamToggle>', () => {
  beforeEach(() => {
    resetAll();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(max-width: 480px)',
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
      })),
    );
  });

  afterEach(() => {
    cleanup();
    resetAll();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the default "enable" label when webcamOptIn is false', () => {
    render(<WebcamToggle />);
    expect(screen.getByRole('button').textContent).toMatch(/enable/i);
  });

  it('aria-pressed reflects the current state', () => {
    render(<WebcamToggle />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      prefsStore.setState({ webcamOptIn: true });
    });
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the new enable-state tooltip (no Post-V1 copy)', () => {
    render(<WebcamToggle />);
    const title = screen.getByRole('button').getAttribute('title') ?? '';
    expect(title).not.toMatch(/Post-V1/i);
    expect(title).toMatch(/never recorded/i);
  });

  it('switches label when webcamOptIn flips to true', () => {
    prefsStore.setState({ webcamOptIn: true });
    render(<WebcamToggle />);
    expect(screen.getByRole('button').textContent).toMatch(/disable/i);
  });

  it('granted path: requestWebcam resolves → opt-in flips true, stream persisted', async () => {
    const track = {
      stop: vi.fn(),
      readyState: 'live',
    } as unknown as MediaStreamTrack;
    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    vi.spyOn(gate, 'requestWebcam').mockResolvedValue({ stream });

    render(<WebcamToggle />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(prefsStore.getState().webcamOptIn).toBe(true);
    });
    expect(webcamStreamStore.getState().activeStream).toBe(stream);
    expect(screen.getByRole('button').textContent).toMatch(/disable/i);
  });

  it('denied path: webcamOptIn stays false, inline copy appears', async () => {
    vi.spyOn(gate, 'requestWebcam').mockResolvedValue({ error: 'denied' });
    render(<WebcamToggle />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findByText(/Camera access denied/i);
    expect(prefsStore.getState().webcamOptIn).toBe(false);
    expect(webcamStreamStore.getState().activeStream).toBeNull();
  });

  it('disable click stops tracks and resets opt-in', async () => {
    const track = {
      stop: vi.fn(),
      readyState: 'live',
    } as unknown as MediaStreamTrack;
    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    prefsStore.setState({ webcamOptIn: true });
    webcamStreamStore.setState({ activeStream: stream });

    render(<WebcamToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(prefsStore.getState().webcamOptIn).toBe(false);
    expect(webcamStreamStore.getState().activeStream).toBeNull();
  });
});
