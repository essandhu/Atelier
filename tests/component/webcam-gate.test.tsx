import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  WebcamConsentGate,
  requestWebcam,
  tearDownStream,
} from '@/interaction/webcam/gate';
import { prefsStore } from '@/store/prefs-store';

type MediaDevicesWindow = Window &
  typeof globalThis & {
    navigator: Navigator & {
      mediaDevices?: {
        getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream>;
      };
    };
  };

const resetPrefs = () =>
  prefsStore.setState({
    webcamOptIn: false,
    deviceOrientationOptIn: false,
    hasSeenIntro: false,
    reducedMotion: false,
  });

const fakeTrack = (): MediaStreamTrack => {
  let state: 'live' | 'ended' = 'live';
  return {
    stop: vi.fn(() => {
      state = 'ended';
    }),
    get readyState() {
      return state;
    },
  } as unknown as MediaStreamTrack;
};

const fakeStream = (tracks: MediaStreamTrack[]): MediaStream =>
  ({ getTracks: () => tracks }) as unknown as MediaStream;

const installGetUserMedia = (
  impl: (c: MediaStreamConstraints) => Promise<MediaStream>,
): void => {
  const w = window as MediaDevicesWindow;
  Object.defineProperty(w.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: impl },
  });
};

const removeMediaDevices = (): void => {
  const w = window as MediaDevicesWindow;
  Object.defineProperty(w.navigator, 'mediaDevices', {
    configurable: true,
    value: undefined,
  });
};

describe('webcam/gate', () => {
  beforeEach(() => {
    resetPrefs();
  });

  afterEach(() => {
    cleanup();
    resetPrefs();
    vi.restoreAllMocks();
  });

  describe('requestWebcam', () => {
    it('returns stream on success and tracks webcam.opted_in', async () => {
      const track1 = fakeTrack();
      const stream = fakeStream([track1]);
      installGetUserMedia(() => Promise.resolve(stream));
      const result = await requestWebcam();
      expect('stream' in result).toBe(true);
      if ('stream' in result) expect(result.stream).toBe(stream);
    });

    it('returns denied on NotAllowedError', async () => {
      const err = Object.assign(new Error('denied'), {
        name: 'NotAllowedError',
      });
      installGetUserMedia(() => Promise.reject(err));
      const result = await requestWebcam();
      expect(result).toEqual({ error: 'denied' });
    });

    it('returns unsupported when mediaDevices is absent', async () => {
      removeMediaDevices();
      const result = await requestWebcam();
      expect(result).toEqual({ error: 'unsupported' });
    });

    it('returns reduced-motion without calling getUserMedia when reducedMotion is true', async () => {
      prefsStore.setState({ reducedMotion: true });
      const gum = vi.fn();
      installGetUserMedia(gum as never);
      const result = await requestWebcam();
      expect(result).toEqual({ error: 'reduced-motion' });
      expect(gum).not.toHaveBeenCalled();
    });
  });

  describe('tearDownStream', () => {
    it('calls stop() on every track and is idempotent', () => {
      const t1 = fakeTrack();
      const t2 = fakeTrack();
      const s = fakeStream([t1, t2]);
      tearDownStream(s);
      expect(t1.stop).toHaveBeenCalledTimes(1);
      expect(t2.stop).toHaveBeenCalledTimes(1);
      expect(t1.readyState).toBe('ended');
      expect(() => tearDownStream(s)).not.toThrow();
    });
  });

  describe('<WebcamConsentGate>', () => {
    it('granted path sets webcamOptIn=true', async () => {
      const stream = fakeStream([fakeTrack()]);
      installGetUserMedia(() => Promise.resolve(stream));
      const onStream = vi.fn();
      render(<WebcamConsentGate onStream={onStream} />);
      fireEvent.click(screen.getByTestId('webcam-gate-enable'));
      await waitFor(() => {
        expect(prefsStore.getState().webcamOptIn).toBe(true);
      });
      expect(onStream).toHaveBeenCalledWith(stream);
    });

    it('denied path renders inline copy and sets webcamOptIn=false', async () => {
      const err = Object.assign(new Error('denied'), {
        name: 'NotAllowedError',
      });
      installGetUserMedia(() => Promise.reject(err));
      render(<WebcamConsentGate />);
      fireEvent.click(screen.getByTestId('webcam-gate-enable'));
      await screen.findByText(/Camera access denied/i);
      expect(prefsStore.getState().webcamOptIn).toBe(false);
    });

    it('unsupported path renders unsupported copy', async () => {
      removeMediaDevices();
      render(<WebcamConsentGate />);
      fireEvent.click(screen.getByTestId('webcam-gate-enable'));
      await screen.findByText(/doesn'?t support camera/i);
      expect(prefsStore.getState().webcamOptIn).toBe(false);
    });

    it('reduced-motion path renders paused copy', async () => {
      prefsStore.setState({ reducedMotion: true });
      installGetUserMedia(() => Promise.resolve(fakeStream([fakeTrack()])));
      render(<WebcamConsentGate />);
      fireEvent.click(screen.getByTestId('webcam-gate-enable'));
      await screen.findByText(/reduced-motion/i);
      expect(prefsStore.getState().webcamOptIn).toBe(false);
    });
  });
});
