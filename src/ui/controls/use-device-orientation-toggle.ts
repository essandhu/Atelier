'use client';

import { usePrefsStore, prefsStore } from '@/store/prefs-store';
import { track } from '@/telemetry/events';

export type EnableOutcome = 'granted' | 'denied' | 'unsupported';

export interface DeviceOrientationToggle {
  enabled: boolean;
  available: boolean;
  needsPermission: boolean;
  enable: () => Promise<EnableOutcome>;
  disable: () => void;
}

interface IOSDeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

const getDOE = (): IOSDeviceOrientationEvent | undefined => {
  if (typeof globalThis === 'undefined') return undefined;
  const g = globalThis as unknown as {
    DeviceOrientationEvent?: IOSDeviceOrientationEvent | undefined;
  };
  return g.DeviceOrientationEvent;
};

const isAvailable = (): boolean => getDOE() !== undefined;

const requiresIOSPermission = (): boolean => {
  const doe = getDOE();
  return !!doe && typeof doe.requestPermission === 'function';
};

/**
 * Hook owning the opt-in prefs transition + iOS 13+ permission prompt.
 * Must be invoked from a user-gesture click handler (iOS requirement).
 * Event-listener wiring lives in `<DeviceOrientationListener>` (Scene wire-up).
 */
export const useDeviceOrientationToggle = (): DeviceOrientationToggle => {
  const enabled = usePrefsStore((s) => s.deviceOrientationOptIn);
  const available = isAvailable();
  const needsPermission = requiresIOSPermission();

  const enable = async (): Promise<EnableOutcome> => {
    if (prefsStore.getState().reducedMotion) {
      track({ name: 'device_orientation.disabled' });
      return 'denied';
    }
    if (!available) {
      track({ name: 'device_orientation.disabled' });
      return 'unsupported';
    }
    if (needsPermission) {
      const doe = getDOE();
      const result = await doe!.requestPermission!();
      if (result === 'granted') {
        prefsStore.getState().setDeviceOrientationOptIn(true);
        track({ name: 'device_orientation.enabled' });
        return 'granted';
      }
      prefsStore.getState().setDeviceOrientationOptIn(false);
      track({ name: 'device_orientation.disabled' });
      return 'denied';
    }
    prefsStore.getState().setDeviceOrientationOptIn(true);
    track({ name: 'device_orientation.enabled' });
    return 'granted';
  };

  const disable = (): void => {
    prefsStore.getState().setDeviceOrientationOptIn(false);
    track({ name: 'device_orientation.disabled' });
  };

  return { enabled, available, needsPermission, enable, disable };
};
