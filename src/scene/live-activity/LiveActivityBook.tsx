'use client';

import { forwardRef, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GithubSnapshot, ContributionDay } from '@/data/github/types';
import type { TimeOfDayState } from '@/time-of-day/types';
import {
  ContributionGrid,
  GRID_COLS,
  GRID_CAPACITY,
} from '@/scene/live-activity/ContributionGrid';
import { EventsFeed } from '@/scene/live-activity/EventsFeed';

// Exported so Phase 4's ProjectBookStack can align next to the live book.
export const BOOK_POSITION: [number, number, number] = [-0.05, 0.793, 0.12];
export const BOOK_ROTATION: [number, number, number] = [0, 0.08, 0];

const BOOK_WIDTH = 0.42;
const BOOK_DEPTH = 0.27;
const COVER_THICKNESS = 0.006;
const PAGE_THICKNESS = 0.0015;
const PAGE_WIDTH = 0.2;
const PAGE_INSET = 0.005;
const SPINE_WIDTH = 0.012;
const COVER_COLOR = '#3a2015';
const PAGE_COLOR = '#f2ead8';
const SPINE_COLOR = '#2a150c';
const RIBBON_COLOR = '#c77a3b';

const ERROR_COPY = "GitHub hasn't replied yet — try again in a moment.";

const zeroedContributions = (count: number): ContributionDay[] => {
  const out: ContributionDay[] = [];
  const today = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getTime() - (count - 1 - i) * oneDay);
    out.push({
      date: d.toISOString().slice(0, 10),
      count: 0,
      level: 0,
    });
  }
  return out;
};

const ZEROED_GRID = zeroedContributions(GRID_CAPACITY - 1);

const BookGeometry = forwardRef<THREE.Mesh>(function BookGeometry(_, rightPageRef) {
  return (
    <group>
      <mesh position={[0, -COVER_THICKNESS / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[BOOK_WIDTH, COVER_THICKNESS, BOOK_DEPTH]} />
        <meshStandardMaterial
          color={COVER_COLOR}
          roughness={0.55}
          metalness={0.08}
        />
      </mesh>

      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[SPINE_WIDTH, PAGE_THICKNESS * 2, BOOK_DEPTH - PAGE_INSET]} />
        <meshStandardMaterial color={SPINE_COLOR} roughness={0.7} />
      </mesh>

      <mesh
        position={[-(PAGE_WIDTH / 2) - SPINE_WIDTH / 2, 0, 0]}
        receiveShadow
      >
        <boxGeometry
          args={[PAGE_WIDTH, PAGE_THICKNESS, BOOK_DEPTH - PAGE_INSET]}
        />
        <meshStandardMaterial
          color={PAGE_COLOR}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      <mesh
        ref={rightPageRef}
        position={[(PAGE_WIDTH / 2) + SPINE_WIDTH / 2, 0, 0]}
        receiveShadow
      >
        <boxGeometry
          args={[PAGE_WIDTH, PAGE_THICKNESS, BOOK_DEPTH - PAGE_INSET]}
        />
        <meshStandardMaterial
          color={PAGE_COLOR}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      <mesh
        position={[
          (PAGE_WIDTH / 2) + SPINE_WIDTH / 2 - 0.01,
          PAGE_THICKNESS,
          -(BOOK_DEPTH / 2) - 0.02,
        ]}
      >
        <boxGeometry args={[0.004, 0.0005, 0.08]} />
        <meshStandardMaterial color={RIBBON_COLOR} roughness={0.4} />
      </mesh>
    </group>
  );
});

export interface LiveActivityBookProps {
  snapshot: GithubSnapshot | null;
  state: TimeOfDayState;
  newEventIds?: Set<string>;
  pageFlutterRef?: React.RefObject<THREE.Mesh | null>;
}

const LEFT_PAGE_CENTER: [number, number, number] = [
  -(PAGE_WIDTH / 2) - SPINE_WIDTH / 2,
  PAGE_THICKNESS + 0.0005,
  0,
];

const RIGHT_PAGE_SURFACE_Y = PAGE_THICKNESS + 0.0005;

export const LiveActivityBook = ({
  snapshot,
  state,
  newEventIds,
  pageFlutterRef,
}: LiveActivityBookProps): React.ReactElement => {
  const contributions = useMemo(() => {
    if (!snapshot || snapshot.contributions.length === 0) return ZEROED_GRID;
    return snapshot.contributions;
  }, [snapshot]);

  const isError = snapshot === null;
  const isLoading =
    !isError &&
    snapshot.contributions.length === 0 &&
    snapshot.events.length === 0;
  const isPopulated = !isError && !isLoading;

  return (
    <group position={BOOK_POSITION} rotation={BOOK_ROTATION}>
      {/* DOM marker for e2e; R3F `<group>` does not emit a DOM node, so we
         portal a zero-size element via drei `<Html>` to expose a testid. */}
      <Html>
        <div
          data-testid="live-activity-book"
          aria-hidden
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        />
      </Html>
      <BookGeometry ref={pageFlutterRef} />

      <group position={LEFT_PAGE_CENTER}>
        <ContributionGrid contributions={contributions} state={state} />
      </group>

      {isError ? (
        <Html
          transform
          occlude={false}
          distanceFactor={1}
          position={[
            (PAGE_WIDTH / 2) + SPINE_WIDTH / 2,
            RIGHT_PAGE_SURFACE_Y,
            0,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <div
            data-testid="live-activity-error"
            style={{
              width: '360px',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: 'rgb(232 226 212 / 0.55)',
              lineHeight: 1.4,
              fontStyle: 'italic',
            }}
          >
            {ERROR_COPY}
          </div>
        </Html>
      ) : null}

      {isLoading ? (
        <Html
          transform
          occlude={false}
          distanceFactor={1}
          position={[
            (PAGE_WIDTH / 2) + SPINE_WIDTH / 2,
            RIGHT_PAGE_SURFACE_Y,
            0,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <div
            data-testid="live-activity-loading"
            style={{
              width: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: '18px',
                  borderRadius: '2px',
                  backgroundColor: 'rgb(232 226 212 / 0.08)',
                  animation: `pulse 1.4s ease-in-out ${i * 0.12}s infinite`,
                }}
              />
            ))}
            <style>
              {`@keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 0.9 } }`}
            </style>
          </div>
        </Html>
      ) : null}

      {isPopulated ? (
        <EventsFeed
          events={snapshot.events}
          newEventIds={newEventIds}
          htmlProps={{
            transform: true,
            occlude: false,
            distanceFactor: 1,
            position: [
              (PAGE_WIDTH / 2) + SPINE_WIDTH / 2,
              RIGHT_PAGE_SURFACE_Y,
              0,
            ],
            rotation: [-Math.PI / 2, 0, 0],
          }}
        />
      ) : null}
    </group>
  );
};

// Silence the unused warning for GRID_COLS (kept exported for Phase 4 layouts).
void GRID_COLS;
