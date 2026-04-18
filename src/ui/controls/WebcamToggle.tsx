'use client';

import { useState } from 'react';
import { usePrefsStore, prefsStore } from '@/store/prefs-store';
import { webcamStreamStore, disableWebcam } from '@/store/webcam-stream-store';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';
import { TAB_ORDER } from '@/interaction/tab-order';
import { requestWebcam } from '@/interaction/webcam/gate';
import { track } from '@/telemetry/events';

export interface WebcamToggleProps {
  /** Test hook: when true, skip the viewport-hidden branch. */
  forceShow?: boolean;
}

const TOOLTIP_OFF =
  'Enable head-tracked parallax — your camera, never recorded.';
const TOOLTIP_ON = 'Disable head-tracked parallax.';

type GateError = 'denied' | 'unsupported' | 'reduced-motion';

const errorCopy = (error: GateError): string => {
  if (error === 'denied')
    return 'Camera access denied. Mouse and touch work the same — no pressure.';
  if (error === 'unsupported')
    return "This browser doesn't support camera access. Skipping parallax.";
  return 'Parallax is paused while reduced-motion is on.';
};

export const WebcamToggle = ({
  forceShow = false,
}: WebcamToggleProps): React.ReactElement | null => {
  const narrow = useIsNarrowViewport();
  const webcamOptIn = usePrefsStore((s) => s.webcamOptIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<GateError | null>(null);

  if (!forceShow && narrow) return null;

  const handleClick = async (): Promise<void> => {
    if (webcamOptIn) {
      disableWebcam();
      track({ name: 'webcam.disabled' });
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await requestWebcam();
    if ('error' in result) {
      setError(result.error);
      setBusy(false);
      return;
    }
    webcamStreamStore.getState().setActiveStream(result.stream);
    prefsStore.getState().setWebcamOptIn(true);
    // Intent-tracked inside gate as webcam.opted_in; runtime-enabled event
    // fires here when the stream is actually live and routed to the tracker.
    track({ name: 'webcam.enabled' });
    setBusy(false);
  };

  const label = webcamOptIn
    ? 'Disable head-tracked parallax'
    : 'Enable head-tracked parallax';
  const tooltip = webcamOptIn ? TOOLTIP_ON : TOOLTIP_OFF;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <button
        type="button"
        role="button"
        aria-pressed={webcamOptIn}
        aria-busy={busy}
        disabled={busy}
        tabIndex={TAB_ORDER.webcamToggle}
        title={tooltip}
        onClick={() => {
          void handleClick();
        }}
        data-testid="webcam-toggle"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          fontSize: '0.85rem',
          borderRadius: '0.375rem',
          border: `1px solid ${
            webcamOptIn
              ? 'var(--accent)'
              : 'color-mix(in oklab, var(--color-ink) 20%, transparent)'
          }`,
          color: webcamOptIn ? 'var(--accent)' : 'var(--color-ink)',
          background: webcamOptIn
            ? 'color-mix(in oklab, var(--accent) 8%, transparent)'
            : 'transparent',
          cursor: busy ? 'progress' : 'pointer',
          fontFamily: 'var(--font-sans)',
          alignSelf: 'flex-start',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: webcamOptIn
              ? 'var(--accent)'
              : 'color-mix(in oklab, var(--color-ink) 30%, transparent)',
          }}
        />
        {label}
      </button>
      {error && (
        <p
          role="status"
          data-testid="webcam-toggle-error"
          style={{
            margin: 0,
            fontSize: '0.78rem',
            lineHeight: 1.4,
            opacity: 0.82,
          }}
        >
          {errorCopy(error)}
        </p>
      )}
    </div>
  );
};
