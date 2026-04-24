'use client';

// R3F hook that binds a loaded GLB's animations to the scene-store
// phase machine. One hook call per dockable object instance.
//
// Responsibilities:
//   - Build an `AnimationMixer` for the supplied scene graph.
//   - Advance the mixer on each frame.
//   - On every phase transition, consult `resolveClipAction()` and
//     execute the returned action (play / stop / snap-to-end).
//   - Clean up the mixer on unmount.
//
// Deliberately thin — all routing decisions live in `clip-routing.ts`
// where they can be unit-tested without R3F.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore, type PanelPhase } from '@/store/scene-store';
import { usePrefsStore } from '@/store/prefs-store';
import {
  resolveClipAction,
  type ClipName,
} from '@/interaction/skinned-motion/clip-routing';

export interface UseObjectClipsArgs {
  /** Root Object3D of the loaded GLB (i.e. `gltf.scene` or the per-kind subtree). */
  root: THREE.Object3D | null;
  /** AnimationClips shipped with the GLB. */
  clips: readonly THREE.AnimationClip[];
  /**
   * Predicate — given the active-panel descriptor, whether THIS object
   * owns it. Pattern mirrors `useDockDriver(isActive: boolean)`.
   */
  isActive: boolean;
}

/**
 * Drive the authored animation clips on a single dockable object.
 *
 * Non-fatal when clips are missing — the hook simply does nothing for
 * the missing names, matching the brief's optional-clip rules.
 */
export const useObjectClips = ({
  root,
  clips,
  isActive,
}: UseObjectClipsArgs): void => {
  const phase = useSceneStore((s) => s.phase);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<ClipName, THREE.AnimationAction>>(new Map());
  const availableRef = useRef<ReadonlySet<ClipName>>(new Set());
  const prevPhaseRef = useRef<PanelPhase | null>(null);

  const clipMap = useMemo(() => {
    const map = new Map<ClipName, THREE.AnimationClip>();
    for (const clip of clips) {
      // Narrow to the known clip names. Unknown names are ignored; the
      // validation test warns at build time.
      const name = clip.name as ClipName;
      map.set(name, clip);
    }
    return map;
  }, [clips]);

  // Build / rebuild the mixer when the root or clips change.
  useEffect(() => {
    if (!root) return;
    const mixer = new THREE.AnimationMixer(root);
    mixerRef.current = mixer;

    const actions = new Map<ClipName, THREE.AnimationAction>();
    const available = new Set<ClipName>();
    for (const [name, clip] of clipMap) {
      const action = mixer.clipAction(clip);
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
      actions.set(name, action);
      available.add(name);
    }
    actionsRef.current = actions;
    availableRef.current = available;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      actionsRef.current = new Map();
      availableRef.current = new Set();
      mixerRef.current = null;
    };
  }, [root, clipMap]);

  // Advance the mixer on each frame. Skip when there's no mixer yet.
  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  // React to phase transitions. Subscribe to phase via useSceneStore so
  // the effect re-runs on every change; other state (isActive,
  // reducedMotion) is closed over in the handler.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    const available = availableRef.current;
    const actions = actionsRef.current;
    if (actions.size === 0) return;

    const action = resolveClipAction({
      prev,
      next: phase,
      isActive,
      reducedMotion,
      available,
    });

    switch (action.kind) {
      case 'none':
        return;
      case 'play': {
        const a = actions.get(action.clip);
        if (!a) return;
        a.reset();
        a.loop = action.loop ? THREE.LoopRepeat : THREE.LoopOnce;
        a.fadeIn(action.fadeInSec);
        a.play();
        return;
      }
      case 'stop': {
        const a = actions.get(action.clip);
        if (!a) return;
        a.fadeOut(action.fadeOutSec);
        return;
      }
      case 'snap-to-end': {
        const a = actions.get(action.clip);
        const clip = clipMap.get(action.clip);
        if (!a || !clip) return;
        a.reset();
        a.time = clip.duration;
        a.paused = true;
        a.play();
        // Force an immediate mixer tick so transforms commit this frame.
        mixerRef.current?.update(0);
        return;
      }
    }
  }, [phase, isActive, reducedMotion, clipMap]);
};
