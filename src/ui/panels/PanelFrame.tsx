'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog as DialogPrimitive,
  VisuallyHidden as VisuallyHiddenPrimitive,
} from 'radix-ui';
import { XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { usePrefsStore } from '@/store/prefs-store';
import { durations, easings } from '@/ui/motion/tokens';
import { Button } from '@/ui/primitives/button';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';

export interface PanelFrameProps {
  children: ReactNode;
  titleId: string;
  ariaLabel: string;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  backgroundColor: 'transparent',
  pointerEvents: 'none',
};

const contentWrapperStyleFor = (narrow: boolean): React.CSSProperties => ({
  position: 'fixed',
  inset: 0,
  zIndex: 51,
  display: 'flex',
  alignItems: narrow ? 'stretch' : 'center',
  justifyContent: 'center',
  padding: narrow ? 0 : '2rem',
  pointerEvents: 'none',
});

const stopScrollPropagation = (e: React.WheelEvent) => {
  e.stopPropagation();
};

export const PanelFrame = ({
  children,
  titleId,
  ariaLabel,
  onClose,
}: PanelFrameProps): React.ReactElement => {
  const phase = useSceneStore((s) => s.phase);
  const isOpen = phase === 'opening' || phase === 'open';
  const narrow = useIsNarrowViewport();
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);

  // Drive store phase transitions on a timer tied to the entry/exit durations.
  // Decoupling from Framer Motion's onAnimationComplete avoids races with
  // Radix's portal teardown when `open` flips false.
  useEffect(() => {
    if (phase === 'opening') {
      const id = window.setTimeout(() => {
        if (sceneStore.getState().phase === 'opening') {
          sceneStore.getState().markOpened();
        }
      }, durations.panel);
      return () => window.clearTimeout(id);
    }
    if (phase === 'closing') {
      const id = window.setTimeout(() => {
        if (sceneStore.getState().phase === 'closing') {
          sceneStore.getState().markClosed();
        }
      }, durations.med);
      return () => window.clearTimeout(id);
    }
  }, [phase]);

  return (
    <DialogPrimitive.Root
      open={isOpen}
      modal
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} />
        <div style={contentWrapperStyleFor(narrow)}>
          <DialogPrimitive.Content
            data-testid="panel-frame"
            data-reduced-motion={reducedMotion ? 'true' : 'false'}
            aria-labelledby={titleId}
            aria-describedby={undefined}
            onPointerDownOutside={onClose}
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: narrow ? '100%' : '42rem',
              maxHeight: narrow ? '100dvh' : '70vh',
              overflowY: 'auto',
              padding: 0,
              backgroundColor: 'transparent',
              border: 0,
              outline: 0,
            }}
          >
            {/*
              Radix requires a DialogTitle for a11y; the panel content below
              already renders its own visible heading with id={titleId}, and
              aria-labelledby on DialogContent routes the accessible name
              there. The visually-hidden title exists only to satisfy Radix
              and must NOT share an id with the visible heading (duplicate
              ids are a serious-impact axe violation — see P9-06 contract
              test).
            */}
            <VisuallyHiddenPrimitive.Root asChild>
              <DialogPrimitive.Title>{ariaLabel}</DialogPrimitive.Title>
            </VisuallyHiddenPrimitive.Root>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: durations.panel / 1000,
                ease: easings.uiIn,
              }}
              onWheel={stopScrollPropagation}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                padding: narrow ? '1.25rem' : '2rem',
                borderRadius: narrow ? 0 : '0.375rem',
                border: narrow
                  ? 'none'
                  : '1px solid rgba(232, 226, 212, 0.18)',
                backgroundColor: 'rgba(15, 12, 10, 0.92)',
                color: 'var(--color-ink)',
                boxShadow: narrow ? 'none' : '0 12px 48px rgba(0,0,0,0.45)',
                position: 'relative',
                minHeight: narrow ? '100dvh' : undefined,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close panel"
                  onClick={onClose}
                >
                  <XIcon />
                </Button>
              </div>
              {children}
            </motion.div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
