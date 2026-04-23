'use client';

// <Html transform> surface helpers (§5.5 / §5.6). The camera-dock pose
// authors the world-space target for the *object group*; the
// `<Html transform>` surface still needs to render flush on a named mesh
// child (the page face of a book, the drawer face of the catalog, the card
// front of the contact card). This module exposes a hook that consumes a
// THREE.Group (the dockable object's transform) and the surfaceNode name
// from the `ReadingPose` and returns the transform props to apply to the
// `<Html transform>` child so the DOM surface matches the mesh frame.
//
// Until the scene objects actually expose a child mesh whose name matches
// the `surfaceNode`, this helper returns the identity transform (position
// origin, rotation zero, scale 1). That is sufficient for the panel to
// render during dock at the object's pivot; per-surface alignment happens
// at P10-16 when each dockable object gains its named surface mesh.

import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';

export interface SurfaceTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const IDENTITY: SurfaceTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

/**
 * Resolve the named surface child on the group and return its local
 * transform. Returns the identity transform when the node isn't found —
 * the 2D PanelFrame remains the authoritative a11y tree either way.
 *
 * Follow-up (P10-16): once dockable objects expose a named mesh (e.g.
 * `projectBook:page`), replace the identity fallback with the resolved
 * matrix decomposed into position/rotation/scale.
 */
export const useSurfaceTransform = (
  groupRef: React.RefObject<THREE.Object3D | null>,
  surfaceNode: string,
): SurfaceTransform => {
  // Memoize the identity (new array literals would re-render consumers
  // every frame otherwise).
  const identity = useMemo<SurfaceTransform>(() => IDENTITY, []);
  const resolved = useRef<SurfaceTransform>(identity);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || !surfaceNode) return;
    const node = group.getObjectByName(surfaceNode);
    if (!node) {
      resolved.current = identity;
      return;
    }
    resolved.current = {
      position: [node.position.x, node.position.y, node.position.z],
      rotation: [node.rotation.x, node.rotation.y, node.rotation.z],
      scale: [node.scale.x, node.scale.y, node.scale.z],
    };
  }, [groupRef, surfaceNode, identity]);

  return resolved.current;
};
