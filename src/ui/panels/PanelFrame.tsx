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
import { durations, easings } from '@/ui/motion/tokens';
import { Button } from '@/ui/primitives/button';

export interface PanelFrameProps {
  children: ReactNode;
  titleId: string;
  ariaLabel: string;
  onClose: () => void;
  muted?: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  backgroundColor: 'transparent',
  pointerEvents: 'none',
};

const contentWrapperStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 51,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  pointerEvents: 'none',
};

const stopScrollPropagation = (e: React.WheelEvent) => {
  e.stopPropagation();
};

export const PanelFrame = ({
  children,
  titleId,
  ariaLabel,
  onClose,
  muted = false,
}: PanelFrameProps): React.ReactElement => {
  const phase = useSceneStore((s) => s.phase);
  const isOpen = phase === 'opening' || phase === 'open';

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
        <div style={contentWrapperStyle}>
          <DialogPrimitive.Content
            data-testid="panel-frame"
            aria-labelledby={titleId}
            aria-describedby={undefined}
            onPointerDownOutside={onClose}
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '42rem',
              maxHeight: '70vh',
              overflowY: 'auto',
              padding: 0,
              backgroundColor: 'transparent',
              border: 0,
              outline: 0,
            }}
          >
            <VisuallyHiddenPrimitive.Root asChild>
              <DialogPrimitive.Title id={titleId}>
                {ariaLabel}
              </DialogPrimitive.Title>
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
                padding: '2rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(232, 226, 212, 0.18)',
                backgroundColor: muted
                  ? 'rgba(15, 12, 10, 0.96)'
                  : 'rgba(15, 12, 10, 0.92)',
                color: 'var(--color-ink)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
                position: 'relative',
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
