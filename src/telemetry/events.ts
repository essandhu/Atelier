import type { TimeOfDayState } from '@/time-of-day/types';

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
