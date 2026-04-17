'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Camera } from '@/scene/Camera';
import { Desk } from '@/scene/Desk';
import { Lamp } from '@/scene/Lamp';
import { Window } from '@/scene/Window';
import { DustMotes } from '@/scene/ambient/DustMotes';
import { LampBreathe } from '@/scene/ambient/LampBreathe';
import { PageFlutter } from '@/scene/ambient/PageFlutter';
import { LiveActivityBook } from '@/scene/live-activity/LiveActivityBook';
import { useNewEvents } from '@/scene/live-activity/useNewEvents';
import { Lightmaps } from '@/scene/lighting/Lightmaps';
import { RealTimeLights } from '@/scene/lighting/RealTimeLights';
import { Effects } from '@/scene/post-processing/Effects';
import { timeOfDayStore } from '@/store/time-of-day-store';
import { track } from '@/telemetry/events';
import type { GithubSnapshot } from '@/data/github/types';
import type { Profile } from '@/content/profile';
import type { Project } from '@/content/projects/schemas';

export interface SceneProps {
  githubSnapshot: GithubSnapshot | null;
  profile: Profile;
  projects: Project[];
}

const SURFACE_COLOR = '#0f0c0a';

export const Scene = (props: SceneProps): React.ReactElement => {
  const lampBulbRef = useRef<THREE.Mesh>(null);
  const pageMeshRef = useRef<THREE.Mesh>(null);
  const firedRef = useRef(false);

  // Phase 4 will consume these; keeping the reads explicit so tree-shaking
  // doesn't drop them from the server-rendered payload.
  void props.profile;
  void props.projects;

  const events = useMemo(
    () => props.githubSnapshot?.events ?? [],
    [props.githubSnapshot],
  );
  const newEventIds = useNewEvents(events);

  useEffect(() => {
    timeOfDayStore.getState().ensureInitialized();
  }, []);

  const onCanvasCreated = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    track({
      name: 'scene.loaded',
      at: performance.now(),
      state: timeOfDayStore.getState().resolved ?? 'evening',
    });
  };

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      onCreated={onCanvasCreated}
      style={{ width: '100%', height: '100dvh', display: 'block' }}
      data-testid="scene-canvas"
    >
      <color attach="background" args={[SURFACE_COLOR]} />
      <Suspense fallback={null}>
        <Camera />
        <Lightmaps state="evening">
          <RealTimeLights state="evening" />
          <Desk />
          <Window />
          <Lamp ref={lampBulbRef} />
          <LiveActivityBook
            snapshot={props.githubSnapshot}
            state="evening"
            newEventIds={newEventIds}
            pageFlutterRef={pageMeshRef}
          />
          <DustMotes state="evening" />
          <LampBreathe targetRef={lampBulbRef} state="evening" />
          <PageFlutter targetRef={pageMeshRef} />
        </Lightmaps>
        <Effects state="evening" reducedMotion={false} />
      </Suspense>
    </Canvas>
  );
};
