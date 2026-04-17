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
import { ProjectBookStack } from '@/scene/project-books/ProjectBookStack';
import { useGlobalKeyboard } from '@/interaction/keyboard';
import { usePointerMissed } from '@/interaction/pointer';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { LiveRegion } from '@/ui/a11y/LiveRegion';
import { ProjectPanel } from '@/ui/panels/ProjectPanel';
import { SealedProjectPanel } from '@/ui/panels/SealedProjectPanel';
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

const ActivePanelRenderer = ({
  projects,
}: {
  projects: Project[];
}): React.ReactElement | null => {
  const activePanel = useSceneStore((s) => s.activePanel);
  const phase = useSceneStore((s) => s.phase);
  if (!activePanel || activePanel.kind !== 'project') return null;
  if (phase === 'closed') return null;
  const project = projects.find((p) => p.id === activePanel.id);
  if (!project) return null;
  const close = () => sceneStore.getState().close();
  if (project.visibility === 'nda') {
    return <SealedProjectPanel project={project} onClose={close} />;
  }
  return <ProjectPanel project={project} onClose={close} />;
};

export const Scene = (props: SceneProps): React.ReactElement => {
  const lampBulbRef = useRef<THREE.Mesh>(null);
  const pageMeshRef = useRef<THREE.Mesh>(null);
  const firedRef = useRef(false);

  // profile is consumed by downstream phases; retaining a void-read keeps the
  // SSR payload present until Phase 5 uses it.
  void props.profile;

  const events = useMemo(
    () => props.githubSnapshot?.events ?? [],
    [props.githubSnapshot],
  );
  const newEventIds = useNewEvents(events);

  useGlobalKeyboard();
  const onPointerMissed = usePointerMissed();

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
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onCreated={onCanvasCreated}
        onPointerMissed={onPointerMissed}
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
            <ProjectBookStack projects={props.projects} />
            <DustMotes state="evening" />
            <LampBreathe targetRef={lampBulbRef} state="evening" />
            <PageFlutter targetRef={pageMeshRef} />
          </Lightmaps>
          <Effects state="evening" reducedMotion={false} />
        </Suspense>
      </Canvas>
      <LiveRegion projects={props.projects} />
      <ActivePanelRenderer projects={props.projects} />
    </>
  );
};
