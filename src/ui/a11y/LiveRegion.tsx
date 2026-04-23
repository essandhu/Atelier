'use client';

import { useEffect, useState } from 'react';
import { useSceneStore } from '@/store/scene-store';
import type { Project } from '@/content/projects/schemas';

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const CLEAR_MS = 1000;

export interface LiveRegionProps {
  projects: Project[];
}

export const LiveRegion = ({ projects }: LiveRegionProps): React.ReactElement => {
  const phase = useSceneStore((s) => s.phase);
  const activePanel = useSceneStore((s) => s.activePanel);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const announce = (): string | null => {
      // Vestigial branch — during normal flow `activePanel` is always set
      // through `closing` (scene-store only clears it on `markClosed`).
      // Returning null here avoids the generic Phase 9 string that used
      // to escape if a race ever cleared activePanel mid-close.
      if (!activePanel) return null;
      switch (activePanel.kind) {
        case 'project': {
          const title =
            projects.find((p) => p.id === activePanel.id)?.title ??
            'Details';
          return phase === 'opening'
            ? `${title} details opened`
            : `${title} details closed`;
        }
        case 'skills':
          return phase === 'opening'
            ? 'Skills catalog opened'
            : 'Skills catalog closed';
        case 'globe':
          return phase === 'opening' ? 'Location opened' : 'Location closed';
        case 'events':
          return phase === 'opening'
            ? 'Recent GitHub activity opened'
            : 'Recent GitHub activity closed';
        case 'contact':
          return phase === 'opening' ? 'Contact opened' : 'Contact closed';
      }
    };

    if (phase !== 'opening' && phase !== 'closing') return;
    const msg = announce();
    if (msg === null) return;
    setMessage(msg);

    const timer = window.setTimeout(() => setMessage(''), CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [phase, activePanel, projects]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={SR_ONLY}>
      {message}
    </div>
  );
};
