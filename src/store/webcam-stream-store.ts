import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { tearDownStream } from '@/interaction/webcam/gate';
import { prefsStore } from '@/store/prefs-store';
import { parallaxStore } from '@/store/parallax-store';

export interface WebcamStreamState {
  activeStream: MediaStream | null;
  setActiveStream: (s: MediaStream | null) => void;
}

/**
 * Holds the currently-active MediaStream while the FaceTracker is mounted.
 * `MediaStream` is non-serializable and non-persistable so it lives in a
 * dedicated store rather than being folded into prefs-store.
 */
export const webcamStreamStore = createStore<WebcamStreamState>((set) => ({
  activeStream: null,
  setActiveStream: (s) => set({ activeStream: s }),
}));

/**
 * Single disable path — what the toggle's off-click, the FaceTracker's
 * error handler, and the reduced-motion live toggle all call. Centralising
 * teardown here is what makes "disabling fully tears down media streams"
 * verifiable from one test.
 */
export const disableWebcam = (): void => {
  const stream = webcamStreamStore.getState().activeStream;
  if (stream) tearDownStream(stream);
  webcamStreamStore.getState().setActiveStream(null);
  prefsStore.getState().setWebcamOptIn(false);
  parallaxStore.getState().reset();
};

export const useWebcamStreamStore = <T>(
  selector: (s: WebcamStreamState) => T,
): T => useStore(webcamStreamStore, selector);
