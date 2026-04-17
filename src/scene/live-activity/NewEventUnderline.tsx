'use client';

import { motion } from 'framer-motion';
import { durations, easings } from '@/ui/motion/tokens';

// Visual treatment applied to newly-detected events in the feed.
// `useNewEvents` (P3-08) decides which ids qualify; this component renders
// the accent underline slide-in, scaling from left on first mount.
export const NewEventUnderline = (): React.ReactElement => (
  <motion.span
    aria-hidden
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{
      duration: durations.med / 1000,
      ease: easings.uiIn,
    }}
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -1,
      height: 1,
      backgroundColor: 'var(--accent)',
      transformOrigin: '0 50%',
      pointerEvents: 'none',
    }}
  />
);
