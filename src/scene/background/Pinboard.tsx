'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import {
  PINBOARD_POSITION,
  PINBOARD_SIZE,
} from '@/scene/background/positions';
import { ContributionGrid } from '@/scene/live-activity/ContributionGrid';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { TAB_ORDER } from '@/interaction/tab-order';
import type { ActivityStats, ContributionDay } from '@/data/github/types';
import type { TimeOfDayState } from '@/time-of-day/types';

// Session-storage key: per-tab hashes of the last-shown stats, bucketed by
// card kind. See `buildPulseSet` / `hashActivityStats` for the comparison
// semantics. Distinct from the events-feed key (`atelier.lastSeenEventIds`)
// so a visitor clearing one feed's pulse state doesn't wipe the other.
export const PINBOARD_PULSE_STORAGE_KEY = 'atelier:pinboard:last-stats';

export type PinboardCardKind = 'commits' | 'streak' | 'prs' | 'heatmap';

export interface PinboardCardModel {
  kind: PinboardCardKind;
  // Primary typography — single number or short token. String so we can
  // render "5" and "15K" through the same component.
  value: string;
  // Small-caps label under the number.
  label: string;
  // Optional muted subtitle (e.g. "longest 21" for the streak card).
  subtitle?: string;
  // Screen-reader + hover tooltip text.
  tooltip: string;
  // Local offset within the board (relative to PINBOARD_POSITION).
  // Units: metres. Authored with ±3 mm jitter per the directive so the
  // grid doesn't read as perfectly mechanical.
  offset: [number, number];
}

// Cell = half-width × half-height of the 2×2 grid on the corkboard.
const CELL_HALF_W = PINBOARD_SIZE[0] / 4;
const CELL_HALF_H = PINBOARD_SIZE[1] / 4;
// Anti-mechanical jitter — 3 mm, authored per-card so every card has a
// deterministic offset that still looks hand-placed. Kept small enough
// that the card layout still reads as a 2×2 grid.
const JITTER_MM = 0.003;

export const buildPinboardCards = (
  stats: ActivityStats,
): PinboardCardModel[] => [
  {
    kind: 'commits',
    value: String(stats.commits90d),
    label: 'commits · 90d',
    tooltip: `${stats.commits90d} commits in 90 days`,
    offset: [-CELL_HALF_W + JITTER_MM, CELL_HALF_H - JITTER_MM],
  },
  {
    kind: 'streak',
    value: String(stats.currentStreakDays),
    label: 'streak',
    subtitle: `longest ${stats.longestStreakDays}`,
    tooltip: `${stats.currentStreakDays} day streak (longest ${stats.longestStreakDays})`,
    offset: [CELL_HALF_W - JITTER_MM, CELL_HALF_H + JITTER_MM],
  },
  {
    kind: 'prs',
    value: String(stats.prsMerged90d),
    label: 'PRs merged · 90d',
    tooltip: `${stats.prsMerged90d} PRs merged in 90 days`,
    offset: [-CELL_HALF_W - JITTER_MM, -CELL_HALF_H + JITTER_MM],
  },
  {
    kind: 'heatmap',
    value: '',
    label: 'heatmap',
    tooltip: 'Contribution heatmap — last 90 days',
    offset: [CELL_HALF_W + JITTER_MM, -CELL_HALF_H - JITTER_MM],
  },
];

// Lightweight hash — a deterministic string of the numeric stats pulled
// by each card. Not cryptographic; we just need equality. Using a
// colon-joined primitive string keeps the session-storage payload small
// and JSON-safe.
export const hashActivityStats = (stats: ActivityStats): string =>
  [
    stats.commits90d,
    stats.prsMerged90d,
    stats.currentStreakDays,
    stats.longestStreakDays,
    stats.publicRepos,
    stats.topRepo?.nameWithOwner ?? '-',
    stats.topRepo?.stars ?? 0,
  ].join(':');

// Per-card hash — only the fields that card actually renders. Changes to
// unrelated fields (e.g. topRepo churn) shouldn't pulse the commits card.
const cardHash = (
  kind: PinboardCardKind,
  stats: ActivityStats,
): string => {
  switch (kind) {
    case 'commits':
      return `c:${stats.commits90d}`;
    case 'streak':
      return `s:${stats.currentStreakDays}:${stats.longestStreakDays}`;
    case 'prs':
      return `p:${stats.prsMerged90d}`;
    case 'heatmap':
      // Heatmap is driven by the contributions array, not ActivityStats;
      // we pulse it whenever commits90d changes as a coarse proxy.
      return `h:${stats.commits90d}`;
  }
};

type PerKindHash = Record<PinboardCardKind, string>;

const readStoredHashes = (
  storage: Pick<Storage, 'getItem'> | null,
): PerKindHash | null => {
  if (!storage) return null;
  const raw = storage.getItem(PINBOARD_PULSE_STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as PerKindHash;
  } catch {
    /* corrupted entry falls through to "first visit" */
  }
  return null;
};

const writeStoredHashes = (
  storage: Pick<Storage, 'setItem'> | null,
  hashes: PerKindHash,
): void => {
  storage?.setItem(PINBOARD_PULSE_STORAGE_KEY, JSON.stringify(hashes));
};

// Pure pulse resolver. Returns the set of card kinds whose per-card hash
// differs from the last stored value; first-visit (no key) returns an
// empty set and silently seeds storage so subsequent visits compare
// against today's baseline. Mirrors the `diffNewEventIds` semantics used
// by the events feed so the two systems feel coherent.
export const resolvePulseKinds = (
  stats: ActivityStats,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
): Set<PinboardCardKind> => {
  const current: PerKindHash = {
    commits: cardHash('commits', stats),
    streak: cardHash('streak', stats),
    prs: cardHash('prs', stats),
    heatmap: cardHash('heatmap', stats),
  };
  const stored = readStoredHashes(storage);
  if (stored === null) {
    writeStoredHashes(storage, current);
    return new Set();
  }
  const changed = new Set<PinboardCardKind>();
  (Object.keys(current) as PinboardCardKind[]).forEach((kind) => {
    if (stored[kind] !== current[kind]) changed.add(kind);
  });
  if (changed.size > 0) writeStoredHashes(storage, current);
  return changed;
};

const safeSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

// Board backing colour — matte cork brown, tuned to read as cork under
// morning / day / evening / night lightmaps without going muddy.
const CORKBOARD_COLOR = '#8a6a42';
// Frame trim around the cork — matches WallPiece palette for continuity.
const CORKBOARD_FRAME_COLOR = '#ede5d3';
const CORKBOARD_FRAME_INSET = 0.01;
// Cards sit 3 mm forward of the corkboard SURFACE (which is at +bd/2 on the
// centred cork mesh). The surface offset is added in world space inside the
// card's local frame — it lifts the card proud of the cork's front face so
// the 2D typography isn't z-embedded in the cork box. Pinheads add another
// 4 mm so their spherical silhouette reads clearly against the cork.
const CORK_HALF_DEPTH = 0.01;
const CARD_FORWARD_OFFSET = CORK_HALF_DEPTH + 0.003;
// Pin head sits 4 mm forward of the card surface (local-frame offset, not
// cumulative with CARD_FORWARD_OFFSET since the pin mesh is a child of the
// card's already-offset parent group).
const PIN_FORWARD_OFFSET = 0.004;
const CARD_WIDTH = 0.28;
const CARD_HEIGHT = 0.18;
const CARD_THICKNESS = 0.0008;
const CARD_COLOR = '#f5efe0';

// Drei `<Html transform>` authors DOM at 1 px ≈ 1 world unit at scale 1.
// The card typography is authored at CARD_DOM_WIDTH px and the wrapping
// group scales the HTML down to CARD_WIDTH.
const CARD_DOM_WIDTH = 280;
const CARD_DOM_HEIGHT = 180;
const HTML_SCALE = CARD_WIDTH / CARD_DOM_WIDTH;

// Contribution grid on the heatmap card — the Phase 3 ContributionGrid
// renders in world units; the card slot is ~28 cm wide but the grid is
// ~14 cm wide natively. `CONTRIBUTION_GRID_SCALE` packs the grid into
// the card footprint. Wrapping in a scale group (rather than threading a
// scale prop into ContributionGrid) keeps that component untouched.
const CONTRIBUTION_GRID_SCALE = 1.6;

export interface PinboardProps {
  stats: ActivityStats;
  contributions: ContributionDay[];
  // Optional time-of-day state for the heatmap. When undefined the grid
  // receives a neutral 'day' preset; Scene.tsx wires the resolved state
  // at integration time.
  state?: TimeOfDayState;
}

export const Pinboard = ({
  stats,
  contributions,
  state = 'day',
}: PinboardProps): React.ReactElement => {
  const [bw, bh, bd] = PINBOARD_SIZE;
  const cards = useMemo(() => buildPinboardCards(stats), [stats]);
  const [pulses, setPulses] = useState<Set<PinboardCardKind>>(() => new Set());
  const appliedRef = useRef(false);

  // Resolve pulses on the client, post-mount. Running on a render pass
  // would let sessionStorage writes collide with React's strict-mode
  // double-invoke and cause "every visit pulses" artefacts. `appliedRef`
  // pins it to a single pass.
  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;
    setPulses(resolvePulseKinds(stats, safeSessionStorage()));
  }, [stats]);

  const [hoveredKind, setHoveredKind] = useState<PinboardCardKind | null>(
    null,
  );

  // Keyboard / focus restoration — follow the Globe + LiveActivityBook
  // pattern so the shared scene-store phase machine returns focus after
  // the events panel closes.
  const hotspotAnchorRef = useRef<HTMLDivElement>(null);
  const phase = useSceneStore((s) => s.phase);
  const isEventsActive = useSceneStore(
    (s) => s.activePanel?.kind === 'events',
  );
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (isEventsActive && phase === 'opening') {
      wasActiveRef.current = true;
    }
    if (phase === 'closed' && wasActiveRef.current) {
      hotspotAnchorRef.current?.focus();
      wasActiveRef.current = false;
    }
  }, [phase, isEventsActive]);

  const openEventsPanel = (): void => {
    sceneStore.getState().open({ kind: 'events' });
  };

  const onHotspotKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openEventsPanel();
  };

  const onBoardClick = (event: { stopPropagation: () => void }): void => {
    event.stopPropagation();
    openEventsPanel();
  };

  return (
    <group position={PINBOARD_POSITION}>
      {/* Frame trim — slightly oversized relative to the cork so the
          board reads as a framed panel rather than a raw piece of cork. */}
      <mesh position={[0, 0, -bd / 2]}>
        <boxGeometry
          args={[bw + CORKBOARD_FRAME_INSET * 2, bh + CORKBOARD_FRAME_INSET * 2, bd]}
        />
        <meshStandardMaterial color={CORKBOARD_FRAME_COLOR} roughness={0.85} />
      </mesh>

      {/* Cork backing — also the click target for opening the events panel. */}
      <mesh onClick={onBoardClick}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial color={CORKBOARD_COLOR} roughness={0.95} />
      </mesh>

      {cards.map((card) => (
        <PinboardCard
          key={card.kind}
          card={card}
          contributions={contributions}
          state={state}
          pulse={pulses.has(card.kind)}
          hovered={hoveredKind === card.kind}
          onHoverEnter={() => setHoveredKind(card.kind)}
          onHoverLeave={() =>
            setHoveredKind((prev) => (prev === card.kind ? null : prev))
          }
        />
      ))}

      {/* Focus ring + keyboard hotspot. Matches the Globe pattern: a 1×1
          anchor inside a zero-size <Html> that carries the TAB_ORDER
          slot, aria-* metadata, and the scene-focus-ring class. */}
      <Html center>
        <div
          ref={hotspotAnchorRef}
          tabIndex={TAB_ORDER.pinboard}
          role="button"
          aria-haspopup="dialog"
          aria-label="Open recent GitHub activity (live pinboard)"
          data-testid="pinboard-hotspot"
          className="scene-focus-ring"
          onKeyDown={onHotspotKeyDown}
          style={{ width: 0, height: 0, opacity: 0 }}
        />
      </Html>
    </group>
  );
};

interface PinboardCardProps {
  card: PinboardCardModel;
  contributions: ContributionDay[];
  state: TimeOfDayState;
  pulse: boolean;
  hovered: boolean;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}

const PinboardCard = ({
  card,
  contributions,
  state,
  pulse,
  hovered,
  onHoverEnter,
  onHoverLeave,
}: PinboardCardProps): React.ReactElement => {
  const [ox, oy] = card.offset;

  return (
    <group position={[ox, oy, CARD_FORWARD_OFFSET]}>
      {/* Thin paper card */}
      <mesh
        onPointerOver={onHoverEnter}
        onPointerOut={onHoverLeave}
      >
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS]} />
        <meshStandardMaterial color={CARD_COLOR} roughness={0.92} />
      </mesh>

      {/* Pinhead — small sphere offset to the top-centre of the card. */}
      <mesh position={[0, CARD_HEIGHT / 2 - 0.01, PIN_FORWARD_OFFSET]}>
        <sphereGeometry args={[0.004, 12, 8]} />
        <meshStandardMaterial
          color={pulse ? 'var(--accent)' : '#c9a063'}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Heatmap card hosts the ContributionGrid inside a scaled group so
          the 13×7 grid fits the 28 × 18 cm card footprint. Reuses the
          Phase 3 grid component verbatim; the scale group wraps it rather
          than threading a new `scale` prop through. */}
      {card.kind === 'heatmap' ? (
        <group
          position={[0, 0, CARD_THICKNESS / 2 + 0.001]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={CONTRIBUTION_GRID_SCALE}
        >
          <ContributionGrid contributions={contributions} state={state} />
        </group>
      ) : null}

      {/* Typography — authored as <Html transform> at 1 px ≈ 1 world unit
          then scaled to the card's CARD_WIDTH. Matches the LiveActivity
          right-page pattern so drei's layer sorting stays consistent. */}
      <group
        position={[0, 0, CARD_THICKNESS / 2 + 0.0005]}
        scale={HTML_SCALE}
      >
        <Html transform occlude={false}>
          <div
            data-testid={`pinboard-card-${card.kind}`}
            data-pulse={pulse ? 'true' : 'false'}
            data-hovered={hovered ? 'true' : 'false'}
            role="img"
            aria-label={card.tooltip}
            title={card.tooltip}
            style={{
              width: `${CARD_DOM_WIDTH}px`,
              height: `${CARD_DOM_HEIGHT}px`,
              padding: '18px 20px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent:
                card.kind === 'heatmap' ? 'flex-end' : 'space-between',
              alignItems: 'flex-start',
              // Paper cards carry dark ink — `--color-ink` is tuned for the
              // dark scene surface and disappears on the cream card stock.
              color: '#1f1510',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {card.kind !== 'heatmap' ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '44px',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {card.value}
              </span>
            ) : null}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 400,
                  fontVariantCaps: 'all-small-caps',
                  letterSpacing: '0.04em',
                  textTransform: 'lowercase',
                  position: 'relative',
                }}
              >
                {card.label}
                {pulse ? (
                  <span
                    aria-hidden
                    data-testid={`pinboard-pulse-${card.kind}`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -2,
                      height: 1,
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                ) : null}
              </span>
              {card.subtitle ? (
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    fontWeight: 400,
                    color: 'rgba(31, 21, 16, 0.6)',
                  }}
                >
                  {card.subtitle}
                </span>
              ) : null}
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};
