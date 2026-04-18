'use client';

import { useState } from 'react';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';
import { TAB_ORDER } from '@/interaction/tab-order';
import {
  useDeviceOrientationToggle,
  type EnableOutcome,
} from '@/ui/controls/use-device-orientation-toggle';

export interface DeviceOrientationToggleProps {
  /** Test hook: when true, skip the viewport-hidden branch. */
  forceShow?: boolean;
}

const TOOLTIP_OFF = 'Subtle parallax based on how you tilt your phone.';
const TOOLTIP_ON = 'Disable tilt parallax.';

const errorCopy = (outcome: EnableOutcome): string => {
  if (outcome === 'denied')
    return 'Permission denied. Touch and tap work the same.';
  return "This browser doesn't support device orientation. Skipping parallax.";
};

export const DeviceOrientationToggle = ({
  forceShow = false,
}: DeviceOrientationToggleProps): React.ReactElement | null => {
  const narrow = useIsNarrowViewport();
  const { enabled, available, enable, disable } = useDeviceOrientationToggle();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<EnableOutcome | null>(null);

  if (!available) return null;
  if (!forceShow && !narrow) return null;

  const handleClick = async (): Promise<void> => {
    if (enabled) {
      disable();
      setFailure(null);
      return;
    }
    setBusy(true);
    setFailure(null);
    const outcome = await enable();
    if (outcome !== 'granted') setFailure(outcome);
    setBusy(false);
  };

  const label = enabled ? 'Disable tilt parallax' : 'Enable tilt parallax';
  const tooltip = enabled ? TOOLTIP_ON : TOOLTIP_OFF;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <button
        type="button"
        role="button"
        aria-pressed={enabled}
        aria-busy={busy}
        disabled={busy}
        tabIndex={TAB_ORDER.webcamToggle}
        title={tooltip}
        onClick={() => {
          void handleClick();
        }}
        data-testid="device-orientation-toggle"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          fontSize: '0.85rem',
          borderRadius: '0.375rem',
          border: `1px solid ${
            enabled
              ? 'var(--accent)'
              : 'color-mix(in oklab, var(--color-ink) 20%, transparent)'
          }`,
          color: enabled ? 'var(--accent)' : 'var(--color-ink)',
          background: enabled
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
            background: enabled
              ? 'var(--accent)'
              : 'color-mix(in oklab, var(--color-ink) 30%, transparent)',
          }}
        />
        {label}
      </button>
      {failure && (
        <p
          role="status"
          data-testid="device-orientation-toggle-error"
          style={{
            margin: 0,
            fontSize: '0.78rem',
            lineHeight: 1.4,
            opacity: 0.82,
          }}
        >
          {errorCopy(failure)}
        </p>
      )}
    </div>
  );
};
