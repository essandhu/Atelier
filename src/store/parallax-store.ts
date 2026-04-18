import { createStore } from 'zustand/vanilla';

export interface ParallaxOffset {
  x: number;
  y: number;
  z: number;
}

export interface ParallaxState {
  offset: ParallaxOffset;
  setOffset: (o: ParallaxOffset) => void;
  reset: () => void;
}

const ZERO: ParallaxOffset = { x: 0, y: 0, z: 0 };

/**
 * Write-from-source / read-from-`useFrame` channel for camera parallax.
 * Writers (FaceTracker, DeviceOrientationListener) call `setOffset` at up to
 * 60 Hz. Readers inside `useFrame` bodies call `parallaxStore.getState().offset`
 * — selectors are deliberately bypassed to avoid per-frame React subscriptions.
 */
export const parallaxStore = createStore<ParallaxState>((set) => ({
  offset: { ...ZERO },
  setOffset: (o) => set({ offset: { x: o.x, y: o.y, z: o.z } }),
  reset: () => set({ offset: { ...ZERO } }),
}));
