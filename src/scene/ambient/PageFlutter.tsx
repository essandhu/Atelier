'use client';

import type * as THREE from 'three';

// Phase 2 contract placeholder. Phase 3 owns the implementation: a low-amplitude
// vertex-shader flutter on the LiveActivityBook's right-page mesh. That mesh
// does not exist yet, so this component is a no-op until Phase 3 wires the ref.
interface PageFlutterProps {
  targetRef?: React.RefObject<THREE.Mesh | null>;
}

export const PageFlutter = ({ targetRef }: PageFlutterProps): null => {
  if (!targetRef?.current) return null;
  return null;
};
