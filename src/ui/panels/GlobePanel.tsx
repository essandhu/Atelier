'use client';

import { loadProfile } from '@/data/loaders/projects';
import { locationCoordinates } from '@/content/profile-location';
import { PanelFrame } from '@/ui/panels/PanelFrame';

export interface GlobePanelProps {
  onClose: () => void;
}

const TITLE_ID = 'globe-panel-title';

const formatCoordinates = (lat: number, lon: number): string => {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(1)}°${ns}, ${Math.abs(lon).toFixed(1)}°${ew}`;
};

// Screen readers narrate "31.0°N" as "thirty one point zero degree N" — the
// "°N" cluster is read as two separate characters on some SR/locale pairs.
// Rebuild the same value as a sentence so the narration is legible.
const narrateCoordinates = (lat: number, lon: number): string => {
  const nsWord = lat >= 0 ? 'north' : 'south';
  const ewWord = lon >= 0 ? 'east' : 'west';
  const latAbs = Math.abs(lat).toFixed(1);
  const lonAbs = Math.abs(lon).toFixed(1);
  return `${latAbs} degrees ${nsWord}, ${lonAbs} degrees ${ewWord}`;
};

export const GlobePanel = ({ onClose }: GlobePanelProps): React.ReactElement => {
  const profile = loadProfile();
  const coords = formatCoordinates(
    locationCoordinates.lat,
    locationCoordinates.lon,
  );
  const coordsNarration = narrateCoordinates(
    locationCoordinates.lat,
    locationCoordinates.lon,
  );

  return (
    <PanelFrame
      titleId={TITLE_ID}
      ariaLabel="Location details"
      onClose={onClose}
    >
      <div data-testid="globe-panel">
        <p
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(232, 226, 212, 0.55)',
            margin: 0,
          }}
        >
          Currently based in
        </p>
        <h2
          id={TITLE_ID}
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            margin: '0.35rem 0 0 0',
            letterSpacing: '-0.005em',
          }}
        >
          {profile.location}
        </h2>
        <p
          aria-label={coordsNarration}
          style={{
            fontSize: '0.85rem',
            color: 'rgba(232, 226, 212, 0.55)',
            fontFamily: 'var(--font-mono)',
            margin: '0.5rem 0 0 0',
          }}
        >
          {coords}
        </p>
      </div>
    </PanelFrame>
  );
};
