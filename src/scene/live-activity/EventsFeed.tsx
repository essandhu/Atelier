'use client';

import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { ActivityEvent } from '@/data/github/types';
import { NewEventUnderline } from '@/scene/live-activity/NewEventUnderline';

type HtmlProps = Parameters<typeof Html>[0];

export interface EventsFeedProps {
  events: ActivityEvent[];
  newEventIds?: Set<string>;
  htmlProps?: HtmlProps;
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
  htmlProps,
}: EventsFeedProps): React.ReactElement | null => {
  const items = useMemo(() => events, [events]);
  if (items.length === 0) return null;

  const html = {
    transform: true,
    occlude: false as const,
    distanceFactor: 1,
    position: [0, 0, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    ...htmlProps,
  };

  return (
    <Html {...html}>
      <ol
        data-testid="events-feed"
        aria-label="Recent GitHub activity"
        className="m-0 flex max-h-[420px] list-none flex-col gap-2 overflow-y-auto p-0"
        style={{
          width: '360px',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
        }}
        onWheelCapture={(e) => e.stopPropagation()}
      >
        {items.map((evt) => {
          const isNew = newEventIds?.has(evt.id) ?? false;
          const label = `${KIND_LABEL[evt.kind]} in ${evt.repo}: ${evt.title}`;
          return (
            <li
              key={evt.id}
              className="group flex flex-col gap-1 border-b border-white/5 py-2"
            >
              <div className="flex items-center gap-2">
                <time
                  dateTime={evt.at}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgb(232 226 212 / 0.45)',
                    fontSize: '10px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {formatTimestamp(evt.at)}
                </time>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent)',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  [{KIND_LABEL[evt.kind]}]
                </span>
              </div>
              <div
                className="truncate"
                style={{ color: 'rgb(232 226 212 / 0.6)', fontSize: '11px' }}
              >
                {evt.repo}
              </div>
              <a
                href={evt.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="relative inline-block truncate no-underline"
                style={{
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                }}
              >
                {evt.title}
                {isNew ? <NewEventUnderline /> : null}
              </a>
            </li>
          );
        })}
      </ol>
    </Html>
  );
};
