'use client';

import { useEffect } from 'react';
import { parallaxStore } from '@/store/parallax-store';
import {
  tiltToOffset,
  seedBaseline,
  type TiltBaseline,
  type TiltEvent,
} from '@/interaction/device-orientation';
import { track } from '@/telemetry/events';

const FRAME_DROP_SAMPLE_WINDOW_MS = 5000;
const EVENT_RATE_FLOOR = 30; // Hz

/**
 * Owns the `window.addEventListener('deviceorientation', ...)` subscription
 * while `prefsStore.deviceOrientationOptIn` is true. Lives outside `<Canvas>`
 * since it's DOM/sensor plumbing, not an R3F node.
 */
export const DeviceOrientationListener = (): null => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let baseline: TiltBaseline | null = null;
    let windowStart = performance.now();
    let eventCount = 0;

    const handler = (ev: DeviceOrientationEvent): void => {
      const tiltEvent: TiltEvent = {
        alpha: ev.alpha,
        beta: ev.beta,
        gamma: ev.gamma,
      };
      if (baseline === null) {
        baseline = seedBaseline(tiltEvent);
        return;
      }
      eventCount += 1;
      const elapsed = performance.now() - windowStart;
      if (elapsed >= FRAME_DROP_SAMPLE_WINDOW_MS) {
        const rate = eventCount / (elapsed / 1000);
        if (rate < EVENT_RATE_FLOOR) {
          track({
            name: 'parallax.frame_drop',
            source: 'device_orientation',
            sampledFps: rate,
          });
        }
        windowStart = performance.now();
        eventCount = 0;
      }
      parallaxStore.getState().setOffset(tiltToOffset(tiltEvent, baseline));
    };

    window.addEventListener('deviceorientation', handler, { passive: true });

    return () => {
      window.removeEventListener('deviceorientation', handler);
      parallaxStore.getState().reset();
    };
  }, []);

  return null;
};
