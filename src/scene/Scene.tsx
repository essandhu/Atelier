'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Camera } from '@/scene/Camera';
import { Desk } from '@/scene/Desk';
import { Lamp } from '@/scene/Lamp';
import { Window } from '@/scene/Window';
import { Globe } from '@/scene/Globe';
import { SkillsCatalog } from '@/scene/SkillsCatalog';
import { Bookshelf } from '@/scene/background/Bookshelf';
import { WallPiece } from '@/scene/background/WallPiece';
import { DustMotes } from '@/scene/ambient/DustMotes';
import { LampBreathe } from '@/scene/ambient/LampBreathe';
import { PageFlutter } from '@/scene/ambient/PageFlutter';
import { CoffeeCup } from '@/scene/ambient/CoffeeCup';
import { Plant } from '@/scene/ambient/Plant';
import { Pen } from '@/scene/ambient/Pen';
import { Notes } from '@/scene/ambient/Notes';
import { RibbonSway } from '@/scene/ambient/RibbonSway';
import { LiveActivityBook } from '@/scene/live-activity/LiveActivityBook';
import { useNewEvents } from '@/scene/live-activity/useNewEvents';
import { Lightmaps } from '@/scene/lighting/Lightmaps';
import { RealTimeLights } from '@/scene/lighting/RealTimeLights';
import { ProjectBookStack } from '@/scene/project-books/ProjectBookStack';

// Lazy-load post-processing out of the initial bundle (P9-03). The
// @react-three/postprocessing + postprocessing libraries contribute
// ~30–60 KB gzipped of GPU-only code that never needs to block first scene
// frame — the canvas is already compositing ambient + lamp + desk in frame
// 0, so effects can mount one frame late with zero user-visible pop.
// Suspense fallback is `null` because the cosmetic layer has no meaningful
// placeholder. `verify-bundle-size.mjs` asserts neither 'postprocessing'
// nor '@react-three/postprocessing' chunks land in `/`'s initial manifest
// entry. ColorGrade rides the same boundary via its transitive import from
// Effects.tsx.
const Effects = dynamic(
  () =>
    import('@/scene/post-processing/Effects').then((m) => ({
      default: m.Effects,
    })),
  { ssr: false, loading: () => null },
);
import { useGlobalKeyboard } from '@/interaction/keyboard';
import { usePointerMissed } from '@/interaction/pointer';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { LiveRegion } from '@/ui/a11y/LiveRegion';
import { IntroOverlay } from '@/ui/intro/IntroOverlay';
import { StartupSequence } from '@/ui/intro/StartupSequence';
import { ProjectPanel } from '@/ui/panels/ProjectPanel';
import { GlobePanel } from '@/ui/panels/GlobePanel';
import { SkillsCatalogPanel } from '@/ui/panels/SkillsCatalogPanel';
import { EventsFeedPanel } from '@/ui/panels/EventsFeedPanel';
import {
  timeOfDayStore,
  useResolvedTimeOfDay,
} from '@/store/time-of-day-store';
import {
  prefsStore,
  subscribeToReducedMotion,
  usePrefsStore,
} from '@/store/prefs-store';
import {
  webcamStreamStore,
  disableWebcam,
  useWebcamStreamStore,
} from '@/store/webcam-stream-store';
import { parallaxStore } from '@/store/parallax-store';
import { FaceTracker } from '@/interaction/webcam/FaceTracker';
import { DeviceOrientationListener } from '@/interaction/webcam/DeviceOrientationListener';
import { resolve } from '@/time-of-day/resolve';
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
  githubSnapshot,
  newEventIds,
}: {
  projects: Project[];
  githubSnapshot: GithubSnapshot | null;
  newEventIds: Set<string>;
}): React.ReactElement | null => {
  const activePanel = useSceneStore((s) => s.activePanel);
  const phase = useSceneStore((s) => s.phase);
  if (!activePanel || phase === 'closed') return null;
  const close = () => sceneStore.getState().close();
  if (activePanel.kind === 'project') {
    const project = projects.find((p) => p.id === activePanel.id);
    if (!project) return null;
    return <ProjectPanel project={project} onClose={close} />;
  }
  if (activePanel.kind === 'globe') {
    return <GlobePanel onClose={close} />;
  }
  if (activePanel.kind === 'skills') {
    return <SkillsCatalogPanel onClose={close} />;
  }
  if (activePanel.kind === 'events') {
    return (
      <EventsFeedPanel
        snapshot={githubSnapshot}
        newEventIds={newEventIds}
        onClose={close}
      />
    );
  }
  return null;
};

const ResolvedSceneContent = ({
  lampBulbRef,
  pageMeshRef,
  githubSnapshot,
  projects,
  newEventIds,
}: {
  lampBulbRef: React.RefObject<THREE.Mesh | null>;
  pageMeshRef: React.RefObject<THREE.Mesh | null>;
  githubSnapshot: GithubSnapshot | null;
  projects: Project[];
  newEventIds: Set<string>;
}): React.ReactElement => {
  const state = useResolvedTimeOfDay();
  return (
    <Lightmaps state={state}>
      <RealTimeLights state={state} />
      <Desk />
      <Window state={state} />
      <Bookshelf />
      <WallPiece />
      <Lamp ref={lampBulbRef} />
      <LiveActivityBook
        snapshot={githubSnapshot}
        state={state}
        newEventIds={newEventIds}
        pageFlutterRef={pageMeshRef}
      />
      <ProjectBookStack projects={projects} />
      <SkillsCatalog />
      <Globe />
      <CoffeeCup />
      <Plant />
      <Pen />
      <Notes />
      <RibbonSway />
      <DustMotes state={state} />
      <LampBreathe targetRef={lampBulbRef} state={state} />
      <PageFlutter targetRef={pageMeshRef} />
    </Lightmaps>
  );
};

const ResolvedEffects = (): React.ReactElement => {
  const state = useResolvedTimeOfDay();
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  return <Effects state={state} reducedMotion={reducedMotion} />;
};

export const Scene = (props: SceneProps): React.ReactElement => {
  const lampBulbRef = useRef<THREE.Mesh>(null);
  const pageMeshRef = useRef<THREE.Mesh>(null);
  const firedRef = useRef(false);

  const events = useMemo(
    () => props.githubSnapshot?.events ?? [],
    [props.githubSnapshot],
  );
  const newEventIds = useNewEvents(events);

  useGlobalKeyboard();
  const onPointerMissed = usePointerMissed();

  const webcamOptIn = usePrefsStore((s) => s.webcamOptIn);
  const deviceOrientationOptIn = usePrefsStore(
    (s) => s.deviceOrientationOptIn,
  );
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const activeStream = useWebcamStreamStore((s) => s.activeStream);

  useEffect(() => {
    const cleanup = subscribeToReducedMotion();
    // Seed the current value in case the initial seed ran before matchMedia existed.
    prefsStore.setState({ reducedMotion: prefsStore.getState().reducedMotion });
    return cleanup;
  }, []);

  useEffect(() => {
    const resolved = resolve({ url: new URL(window.location.href) });
    timeOfDayStore.getState().ensureInitialized(resolved);
  }, []);

  // Dev-only debug hook consumed by the Playwright webcam-flow spec to read
  // parallax state + confirm stream teardown. Gated so it ships only in dev.
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV === 'production'
    ) {
      return;
    }
    (window as unknown as Record<string, unknown>).__atelier = {
      parallaxOffset: () => parallaxStore.getState().offset,
      activeStream: () => webcamStreamStore.getState().activeStream,
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__atelier;
    };
  }, []);

  // If reduced-motion flips on mid-session with the webcam active, tear down.
  useEffect(() => {
    if (reducedMotion && webcamOptIn) disableWebcam();
  }, [reducedMotion, webcamOptIn]);

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
          <ResolvedSceneContent
            lampBulbRef={lampBulbRef}
            pageMeshRef={pageMeshRef}
            githubSnapshot={props.githubSnapshot}
            projects={props.projects}
            newEventIds={newEventIds}
          />
          <ResolvedEffects />
        </Suspense>
      </Canvas>
      <ResolvedStateMarker />
      <BackgroundAnchors />
      {webcamOptIn && activeStream && !reducedMotion && (
        <FaceTracker
          stream={activeStream}
          onFrameDrop={(fps) =>
            track({
              name: 'parallax.frame_drop',
              source: 'webcam',
              sampledFps: fps,
            })
          }
          onError={(err) => {
            // Log only — don't tear down on init errors (e.g. MediaPipe load
            // failure). The stream + opt-in stay live so the user can retry
            // or simply keep using the scene without parallax. Explicit
            // teardown still runs through disableWebcam() via the toggle.
            console.warn('[FaceTracker] init error', err.message);
          }}
        />
      )}
      {deviceOrientationOptIn && !reducedMotion && (
        <DeviceOrientationListener />
      )}
      <IntroOverlay profile={props.profile} />
      <StartupSequence lampBulbRef={lampBulbRef} />
      <LiveRegion projects={props.projects} />
      <ActivePanelRenderer
        projects={props.projects}
        githubSnapshot={props.githubSnapshot}
        newEventIds={newEventIds}
      />
    </>
  );
};

const ResolvedStateMarker = (): React.ReactElement => {
  const state = useResolvedTimeOfDay();
  return (
    <div
      aria-hidden="true"
      data-testid="resolved-state"
      data-state={state}
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
    />
  );
};

const BackgroundAnchors = (): React.ReactElement => (
  <>
    <div
      aria-hidden="true"
      data-testid="bookshelf-anchor"
      style={{ display: 'none' }}
    />
    <div
      aria-hidden="true"
      data-testid="wall-piece-anchor"
      style={{ display: 'none' }}
    />
  </>
);
