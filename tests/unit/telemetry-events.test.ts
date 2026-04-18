// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { track, type Event } from '@/telemetry/events';

type DataLayerWindow = Window & { dataLayer?: Event[] };

describe('telemetry/events', () => {
  beforeEach(() => {
    (window as DataLayerWindow).dataLayer = undefined;
  });

  afterEach(() => {
    (window as DataLayerWindow).dataLayer = undefined;
  });

  it('accepts every event variant without error and appends to dataLayer', () => {
    const events: Event[] = [
      { name: 'scene.loaded', at: 0, state: 'evening' },
      {
        name: 'scene.startup_completed',
        state: 'evening',
        reducedMotion: false,
        durationMs: 120,
      },
      { name: 'panel.opened', panelId: 'globe' },
      { name: 'panel.closed', panelId: 'globe', dwellMs: 400 },
      { name: 'globe.spun', durationMs: 800, totalRadians: 3.2 },
      { name: 'webcam.opted_in' },
      { name: 'webcam.declined' },
      { name: 'webcam.enabled' },
      { name: 'webcam.disabled' },
      { name: 'device_orientation.enabled' },
      { name: 'device_orientation.disabled' },
      { name: 'parallax.frame_drop', source: 'webcam', sampledFps: 45 },
      {
        name: 'parallax.frame_drop',
        source: 'device_orientation',
        sampledFps: 20,
      },
      { name: 'fallback.viewed' },
    ];

    for (const e of events) track(e);

    const layer = (window as DataLayerWindow).dataLayer;
    expect(layer).toBeDefined();
    expect(layer).toHaveLength(events.length);
    expect(layer?.[0]).toEqual({
      name: 'scene.loaded',
      at: 0,
      state: 'evening',
    });
    expect(layer?.at(-1)).toEqual({ name: 'fallback.viewed' });
  });
});
