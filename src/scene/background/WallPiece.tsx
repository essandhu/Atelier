'use client';

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import {
  WALL_PIECE_POSITION,
  WALL_PIECE_SIZE,
} from '@/scene/background/positions';

// Matte off-white painted wooden frame. The brief calls for a quiet frame
// that reads neutral under morning, daylight, and evening lightmaps — the
// Blender bake in Stage B will supersede, but the primitive has to hold
// its own until then.
const FRAME_COLOR = '#ede5d3';
// 5 mm bevel on each side: matches the §5.11 spec ("frame wider than the
// inner plane").
const FRAME_BEVEL = 0.005;
const FRAME_DEPTH = 0.025;
// Fallback tint for the inner plane before the texture resolves, matching
// the matte paper tone so the frame doesn't read as a hole while loading.
const INNER_PLACEHOLDER = '#d5cbb5';
const INNER_FORWARD_OFFSET = FRAME_DEPTH / 2 + 0.002;

// Default failover if the component is mounted without an explicit
// `avatarUrl`. Matches `avatarRedirectUrl('ericksandhu')` shape so the
// WallPiece still has a valid pixel source while Scene.tsx is rewired to
// thread the live snapshot value through (concurrent P10-09 edit). The
// prop is optional for the same reason — Scene.tsx currently passes no
// props and another worktree owns that mount.
const DEFAULT_AVATAR_FAILOVER = 'https://github.com/ericksandhu.png?size=460';
// Local avatar baked into /public by the P10-03 fetch script. Missing on
// fresh clones (the file is .gitignored); the TextureLoader `onError`
// callback handles that case by swapping to the redirect URL.
const LOCAL_AVATAR_PATH = '/scene/avatar.jpg';

export interface WallPieceProps {
  // GithubSnapshot.avatarUrl — the stable GitHub redirect used as the
  // failover when the local JPEG is unavailable. Optional so the existing
  // Scene.tsx mount (which is being edited concurrently) continues to
  // compile without prop-threading.
  avatarUrl?: string;
}

export const WallPiece = ({
  avatarUrl = DEFAULT_AVATAR_FAILOVER,
}: WallPieceProps = {}): React.ReactElement => {
  const [w, h] = WALL_PIECE_SIZE;
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Manual TextureLoader chain so we can catch the 404 on missing
  // /scene/avatar.jpg and swap to the redirect without crashing a
  // `useLoader`-driven Suspense boundary. Returning the loaded texture
  // from state keeps the hook signature dependency-free and SSR-safe
  // (TextureLoader lazy-imports Image under the hood via three).
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const apply = (tex: THREE.Texture): void => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      setTexture((prev) => {
        prev?.dispose();
        return tex;
      });
    };

    loader.load(
      LOCAL_AVATAR_PATH,
      apply,
      undefined,
      () => {
        // Local asset missing (fresh clone / pre-ISR) — fall back to the
        // stable GitHub redirect. Silent by design: the WallPiece keeps
        // the placeholder tint if even the failover fails.
        loader.load(avatarUrl, apply, undefined, () => {
          /* placeholder tint stays visible */
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [avatarUrl]);

  // Dispose when the component unmounts.
  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );

  const innerMaterial = useMemo(() => {
    if (texture) {
      return (
        <meshStandardMaterial
          map={texture}
          roughness={0.85}
          metalness={0.0}
        />
      );
    }
    return (
      <meshStandardMaterial
        color={INNER_PLACEHOLDER}
        roughness={0.9}
        metalness={0.0}
      />
    );
  }, [texture]);

  return (
    <group position={WALL_PIECE_POSITION}>
      {/* DOM marker so the scene-geometry-budget scan and any future
          e2e/test can locate the wall piece without instantiating a
          raycaster. Zero-size + aria-hidden: non-interactive per §5.11. */}
      <Html>
        <div
          data-testid="wall-piece"
          aria-hidden
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        />
      </Html>

      {/* Matte painted frame */}
      <mesh>
        <boxGeometry
          args={[w + FRAME_BEVEL * 2, h + FRAME_BEVEL * 2, FRAME_DEPTH]}
        />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.85} />
      </mesh>

      {/* Inner plane carries the avatar texture. Forward offset keeps the
          texture proud of the frame's front face so raking window light
          catches it crisply. */}
      <mesh position={[0, 0, INNER_FORWARD_OFFSET]}>
        <planeGeometry args={[w, h]} />
        {innerMaterial}
      </mesh>
    </group>
  );
};
