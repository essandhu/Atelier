'use client';

import { useMemo } from 'react';
import type { ActivityEvent, GithubSnapshot } from '@/data/github/types';
import { PanelFrame } from '@/ui/panels/PanelFrame';

export interface EventsFeedPanelProps {
  snapshot: GithubSnapshot | null;
  newEventIds?: Set<string>;
  onClose: () => void;
}

const TITLE_ID = 'events-panel-title';

const KIND_LABEL: Record<ActivityEvent['kind'], string> = {
  commit: 'commit',
  pr_opened: 'PR opened',
  pr_merged: 'PR merged',
  issue: 'issue',
  release: 'release',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '-0.005em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  marginTop: '0.35rem',
  color: 'rgba(232, 226, 212, 0.55)',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: '1.25rem 0 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  paddingTop: '0.85rem',
  borderTop: '1px solid rgba(232, 226, 212, 0.08)',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  flexWrap: 'wrap',
};

const timestampStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  color: 'rgba(232, 226, 212, 0.45)',
  fontSize: '0.72rem',
  letterSpacing: '0.02em',
};

const kindStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  color: 'var(--accent)',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const repoStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  color: 'rgba(232, 226, 212, 0.6)',
  fontSize: '0.78rem',
};

const titleLinkStyle: React.CSSProperties = {
  color: 'var(--color-ink)',
  fontWeight: 500,
  fontSize: '0.95rem',
  lineHeight: 1.35,
  textDecoration: 'none',
};

const newBadgeStyle: React.CSSProperties = {
  marginLeft: '0.4rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--accent)',
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  border: '1px solid var(--accent)',
  borderRadius: '999px',
  padding: '0.05rem 0.4rem',
  verticalAlign: 'middle',
};

const emptyStyle: React.CSSProperties = {
  marginTop: '1.25rem',
  fontStyle: 'italic',
  color: 'rgba(232, 226, 212, 0.55)',
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

export const EventsFeedPanel = ({
  snapshot,
  newEventIds,
  onClose,
}: EventsFeedPanelProps): React.ReactElement => {
  const events = useMemo(() => snapshot?.events ?? [], [snapshot]);

  return (
    <PanelFrame
      titleId={TITLE_ID}
      ariaLabel="Recent GitHub activity"
      onClose={onClose}
    >
      <div data-testid="events-feed-panel">
        <p
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(232, 226, 212, 0.55)',
            margin: 0,
          }}
        >
          Live from GitHub
        </p>
        <h2 id={TITLE_ID} style={headingStyle}>
          Recent activity
        </h2>
        <p style={subtitleStyle}>
          Pulled from the public GitHub timeline. Each entry links to the
          source.
        </p>

        {events.length === 0 ? (
          <p style={emptyStyle}>No recent activity to show.</p>
        ) : (
          <ol
            data-testid="events-feed-panel-list"
            aria-label="Recent GitHub activity"
            style={listStyle}
          >
            {events.map((evt) => {
              const isNew = newEventIds?.has(evt.id) ?? false;
              const label = `${KIND_LABEL[evt.kind]} in ${evt.repo}: ${evt.title}`;
              return (
                <li key={evt.id} style={rowStyle}>
                  <div style={metaRowStyle}>
                    <time dateTime={evt.at} style={timestampStyle}>
                      {formatTimestamp(evt.at)}
                    </time>
                    <span style={kindStyle}>[{KIND_LABEL[evt.kind]}]</span>
                    <span style={repoStyle}>{evt.repo}</span>
                  </div>
                  <a
                    href={evt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    style={titleLinkStyle}
                  >
                    {evt.title}
                    {isNew ? (
                      <span style={newBadgeStyle} aria-label="new">
                        new
                      </span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </PanelFrame>
  );
};
