'use client';

import { usePrefsStore, prefsStore } from '@/store/prefs-store';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';
import { TAB_ORDER } from '@/interaction/tab-order';

export interface WebcamToggleProps {
  /** Test hook: when true, skip the viewport-hidden branch. */
  forceShow?: boolean;
}

const TOOLTIP = 'Live parallax arrives Post-V1.';

export const WebcamToggle = ({
  forceShow = false,
}: WebcamToggleProps): React.ReactElement | null => {
  const narrow = useIsNarrowViewport();
  const webcamOptIn = usePrefsStore((s) => s.webcamOptIn);

  if (!forceShow && narrow) return null;

  const toggle = (): void => {
    prefsStore.getState().setWebcamOptIn(!webcamOptIn);
  };

  const label = webcamOptIn
    ? 'Disable head-tracked parallax'
    : 'Enable head-tracked parallax';

  return (
    <button
      type="button"
      role="button"
      aria-pressed={webcamOptIn}
      tabIndex={TAB_ORDER.webcamToggle}
      title={TOOLTIP}
      onClick={toggle}
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
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
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
  );
};
