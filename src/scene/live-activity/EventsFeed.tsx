'use client';

import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { ActivityEvent } from '@/data/github/types';
import { NewEventUnderline } from '@/scene/live-activity/NewEventUnderline';

// Right-page preview: read-only typography that mirrors the first few events.
// Pointer/keyboard activation lives on the LiveActivityBook hotspot, which
// opens the EventsFeedPanel where each entry is a real anchor. Keeping the
// in-scene preview link-free avoids duplicate Tab stops and the well-known
// drei `<Html transform>` pointer-routing pitfalls (the WebGL canvas eats the
// click before the CSS3D layer can react).
export interface EventsFeedProps {
  events: ActivityEvent[];
  newEventIds?: Set<string>;
  domWidth: number;
  domHeight: number;
}

const KIND_LABEL: Record<ActivityEvent['kind'], string> = {
  commit: 'commit',
  pr_opened: 'PR opened',
  pr_merged: 'PR merged',
  issue: 'issue',
  release: 'release',
};

const pad = (n: number): string => n.toString().padStart(2, '0');

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  return `${y}-${m}-${day} ${h}:${min}`;
};

export const EventsFeed = ({
  events,
  newEventIds,
  domWidth,
  domHeight,
}: EventsFeedProps): React.ReactElement | null => {
  const items = useMemo(() => events, [events]);
  if (items.length === 0) return null;

  return (
    <Html transform occlude={false} pointerEvents="none">
      <ol
        data-testid="events-feed"
        aria-hidden="true"
        className="m-0 flex list-none flex-col gap-1.5 p-0"
        style={{
          width: `${domWidth}px`,
          maxHeight: `${domHeight}px`,
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {items.map((evt) => {
          const isNew = newEventIds?.has(evt.id) ?? false;
          return (
            <li
              key={evt.id}
              className="flex flex-col gap-0.5 border-b border-white/5 pb-1"
              aria-hidden="true"
            >
              <div className="flex items-center gap-1.5">
                <time
                  dateTime={evt.at}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgb(232 226 212 / 0.45)',
                    fontSize: '7px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {formatTimestamp(evt.at)}
                </time>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent)',
                    fontSize: '7px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  [{KIND_LABEL[evt.kind]}]
                </span>
              </div>
              <div
                className="truncate"
                style={{ color: 'rgb(232 226 212 / 0.6)', fontSize: '8px' }}
              >
                {evt.repo}
              </div>
              <div
                className="relative truncate"
                style={{
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                  fontSize: '9px',
                }}
              >
                {evt.title}
                {isNew ? <NewEventUnderline /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Html>
  );
};
