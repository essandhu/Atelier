// The `TimeOfDayState` type lives in `src/time-of-day/types.ts` starting in
// Phase 2. Inlined here so Phase 1 doesn't need to ship any `time-of-day/*`
// files (see Phase 1 Out-of-Scope); the union is kept in sync at Phase 2
// import time.
type TimeOfDayState = 'morning' | 'day' | 'evening' | 'night';

export type Event =
  | { name: 'scene.loaded'; at: number; state: TimeOfDayState }
  | { name: 'panel.opened'; projectId: string }
  | { name: 'panel.closed'; projectId: string; dwellMs: number }
  | { name: 'webcam.opted_in' }
  | { name: 'webcam.declined' }
  | { name: 'fallback.viewed' };

type TrackingWindow = Window & {
  dataLayer?: Event[];
  Sentry?: {
    addBreadcrumb?: (breadcrumb: {
      category: string;
      message: string;
      data: Event;
      level: 'info';
    }) => void;
  };
};

export const track = (event: Event): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const w = window as TrackingWindow;

  if (!Array.isArray(w.dataLayer)) {
    w.dataLayer = [];
  }
  w.dataLayer.push(event);

  w.Sentry?.addBreadcrumb?.({
    category: 'telemetry',
    message: event.name,
    data: event,
    level: 'info',
  });
};
