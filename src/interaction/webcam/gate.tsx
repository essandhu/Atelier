'use client';

import { useState } from 'react';
import { prefsStore } from '@/store/prefs-store';
import { track } from '@/telemetry/events';

export type RequestResult =
  | { stream: MediaStream }
  | { error: 'denied' | 'unsupported' | 'reduced-motion' };

const CAPTURE_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: 320, height: 240 },
};

const hasGetUserMedia = (): boolean =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function';

/**
 * Single authoritative entry point for `getUserMedia` across the app.
 * FaceTracker never calls `getUserMedia` directly — it receives a stream
 * and lets the caller (toggle + Scene wire-up) own teardown.
 */
export const requestWebcam = async (): Promise<RequestResult> => {
  if (prefsStore.getState().reducedMotion) {
    track({ name: 'webcam.declined' });
    return { error: 'reduced-motion' };
  }
  if (!hasGetUserMedia()) {
    track({ name: 'webcam.declined' });
    return { error: 'unsupported' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      CAPTURE_CONSTRAINTS,
    );
    track({ name: 'webcam.opted_in' });
    return { stream };
  } catch {
    track({ name: 'webcam.declined' });
    return { error: 'denied' };
  }
};

/**
 * Idempotent stream teardown. Safe to call multiple times — once all tracks
 * are stopped, subsequent calls are no-ops (`track.stop()` on an already-
 * ended track is spec-defined as a no-op).
 */
export const tearDownStream = (stream: MediaStream): void => {
  for (const t of stream.getTracks()) {
    t.stop();
  }
};

const copyFor = (
  error: 'denied' | 'unsupported' | 'reduced-motion',
): string => {
  if (error === 'denied')
    return 'Camera access denied. Mouse and touch work the same — no pressure.';
  if (error === 'unsupported')
    return "This browser doesn't support camera access. Skipping parallax.";
  return 'Parallax is paused while reduced-motion is on.';
};

export interface WebcamConsentGateProps {
  /** Called with the stream on a successful grant. Owner is responsible for teardown. */
  onStream?: (stream: MediaStream) => void;
}

export const WebcamConsentGate = ({
  onStream,
}: WebcamConsentGateProps): React.ReactElement => {
  const [error, setError] = useState<
    'denied' | 'unsupported' | 'reduced-motion' | null
  >(null);
  const [busy, setBusy] = useState(false);

  const handleEnable = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const result = await requestWebcam();
    if ('error' in result) {
      prefsStore.getState().setWebcamOptIn(false);
      setError(result.error);
      setBusy(false);
      return;
    }
    prefsStore.getState().setWebcamOptIn(true);
    onStream?.(result.stream);
    setBusy(false);
  };

  return (
    <div data-testid="webcam-gate">
      <button
        type="button"
        data-testid="webcam-gate-enable"
        aria-busy={busy}
        disabled={busy}
        onClick={handleEnable}
        style={{
          padding: '0.4rem 0.75rem',
          fontSize: '0.85rem',
          borderRadius: '0.375rem',
          border:
            '1px solid color-mix(in oklab, var(--color-ink) 20%, transparent)',
          background: 'transparent',
          color: 'var(--color-ink)',
          cursor: busy ? 'progress' : 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Enable
      </button>
      {error && (
        <p
          role="status"
          data-testid="webcam-gate-error"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            opacity: 0.8,
          }}
        >
          {copyFor(error)}
        </p>
      )}
    </div>
  );
};
