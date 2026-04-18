'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefsStore, prefsStore } from '@/store/prefs-store';
import { Button } from '@/ui/primitives/button';
import { WebcamToggle } from '@/ui/controls/WebcamToggle';
import { DeviceOrientationToggle } from '@/ui/controls/DeviceOrientationToggle';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';
import { TAB_ORDER } from '@/interaction/tab-order';
import { durations, easings } from '@/ui/motion/tokens';
import type { Profile } from '@/content/profile';

export interface IntroOverlayProps {
  profile: Profile;
  onDismiss?: () => void;
}

export const IntroOverlay = ({
  profile,
  onDismiss,
}: IntroOverlayProps): React.ReactElement | null => {
  const hasSeenIntro = usePrefsStore((s) => s.hasSeenIntro);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const narrow = useIsNarrowViewport();
  const beginRef = useRef<HTMLButtonElement>(null);
  // localStorage-backed state diverges between server (false) and hydrated
  // client (possibly true). Gate rendering on a post-mount flag so the
  // server + initial-client render match (both return null).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Auto-focus Begin once the button has actually mounted. Keying on
  // `hydrated` + `hasSeenIntro` matches the render gate below — otherwise the
  // [] effect would fire on the initial-null render and miss the real ref.
  useEffect(() => {
    if (!hydrated || hasSeenIntro) return;
    beginRef.current?.focus({ preventScroll: true });
  }, [hydrated, hasSeenIntro]);

  if (!hydrated || hasSeenIntro) return null;

  const handleBegin = (): void => {
    prefsStore.getState().dismissIntro();
    onDismiss?.();
  };

  const animationDuration = reducedMotion ? 0.08 : durations.slow / 1000;

  return (
    <motion.aside
      data-testid="intro-overlay"
      data-reduced-motion={reducedMotion}
      aria-labelledby="intro-title"
      role="region"
      initial={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 24 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: animationDuration,
        ease: reducedMotion ? 'linear' : easings.uiIn,
      }}
      style={{
        position: 'fixed',
        left: '1.5rem',
        bottom: '1.5rem',
        zIndex: 40,
        maxWidth: 'min(28rem, calc(100vw - 3rem))',
        padding: '1.5rem 1.5rem 1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(232, 226, 212, 0.16)',
        background: 'rgba(15, 12, 10, 0.88)',
        backdropFilter: 'blur(8px)',
        color: 'var(--color-ink)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
      }}
    >
      <h1
        id="intro-title"
        style={{
          fontSize: '1.65rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {profile.name}
      </h1>
      <p
        style={{
          marginTop: '0.25rem',
          fontSize: '0.9rem',
          opacity: 0.8,
        }}
      >
        {profile.role}
      </p>
      <p
        style={{
          marginTop: '0.875rem',
          fontSize: '0.95rem',
          lineHeight: 1.55,
          opacity: 0.92,
        }}
      >
        {profile.positioning}
      </p>

      <div
        style={{
          marginTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            opacity: 0.6,
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {narrow
            ? 'Optional: opt in to tilt parallax.'
            : 'Optional: opt in to head-tracked parallax.'}
        </p>
        {narrow ? <DeviceOrientationToggle /> : <WebcamToggle />}
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          ref={beginRef}
          tabIndex={TAB_ORDER.introBeginButton}
          onClick={handleBegin}
          variant="default"
          data-testid="intro-begin"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
          }}
        >
          Begin
        </Button>
      </div>
    </motion.aside>
  );
};
