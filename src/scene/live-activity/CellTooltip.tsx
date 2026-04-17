'use client';

import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import type { ContributionDay } from '@/data/github/types';

export interface CellTooltipProps {
  day: ContributionDay;
  position: THREE.Vector3;
}

const humanDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const CellTooltip = ({
  day,
  position,
}: CellTooltipProps): React.ReactElement => (
  <Html
    position={[position.x, position.y + 0.02, position.z]}
    center
    zIndexRange={[100, 0]}
    style={{ pointerEvents: 'none' }}
  >
    <div
      data-testid="cell-tooltip"
      role="tooltip"
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '10px',
        letterSpacing: '0.02em',
        padding: '4px 8px',
        borderRadius: '2px',
        backgroundColor: 'rgba(10,8,6,0.88)',
        color: 'var(--color-ink)',
        border: '1px solid rgb(232 226 212 / 0.12)',
        whiteSpace: 'nowrap',
        transform: 'translate(-50%, -100%)',
      }}
    >
      {humanDate(day.date)} · {day.count} contribution
      {day.count === 1 ? '' : 's'}
    </div>
  </Html>
);
