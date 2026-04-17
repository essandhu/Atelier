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
    const activeId =
      activePanel?.kind === 'project' ? activePanel.id : null;

    if (phase === 'opening') {
      const title =
        (activeId && projects.find((p) => p.id === activeId)?.title) ??
        'Details';
      setMessage(`${title} details opened`);
    } else if (phase === 'closing') {
      setMessage('Project panel closed');
    } else {
      return;
    }

    const timer = window.setTimeout(() => setMessage(''), CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [phase, activePanel, projects]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={SR_ONLY}>
      {message}
    </div>
  );
};
