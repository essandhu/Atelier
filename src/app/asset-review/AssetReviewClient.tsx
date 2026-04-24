'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  INTERACTIVE_ASSET_CONTRACTS,
  INTERACTIVE_ASSET_KINDS,
  type InteractiveAssetKind,
} from '@/asset/interactive-asset-contract';

export interface AssetReviewClientProps {
  asset: InteractiveAssetKind | null;
}

export const AssetReviewClient = ({
  asset,
}: AssetReviewClientProps): React.ReactElement => {
  if (!asset) return <KindPicker />;
  return <AssetViewer kind={asset} />;
};

// --- Kind picker ------------------------------------------------------------

const KindPicker = (): React.ReactElement => (
  <main style={panelStyle}>
    <h1 style={titleStyle}>Atelier — Asset Review</h1>
    <p style={subtitleStyle}>
      Pick an interactive asset kind to review. Each entry loads the matching
      GLB from <code>/public/scene/models/</code> and binds the clip scrubber
      below.
    </p>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {INTERACTIVE_ASSET_KINDS.map((kind) => {
        const c = INTERACTIVE_ASSET_CONTRACTS[kind];
        return (
          <li key={kind} style={{ marginBottom: 12 }}>
            <Link
              href={`/asset-review?asset=${kind}`}
              style={linkStyle}
              prefetch={false}
            >
              <strong>{kind}</strong>
              <span style={{ marginLeft: 12, opacity: 0.7 }}>
                /public/scene/models/{c.file}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
    <p style={{ marginTop: 32, opacity: 0.5, fontSize: 12 }}>
      Dev-only route. Not routed in production.
    </p>
  </main>
);

// --- Asset viewer -----------------------------------------------------------

interface AssetViewerProps {
  kind: InteractiveAssetKind;
}

const AssetViewer = ({ kind }: AssetViewerProps): React.ReactElement => {
  const contract = INTERACTIVE_ASSET_CONTRACTS[kind];
  const url = `/scene/models/${contract.file}`;

  return (
    <main style={viewerLayoutStyle}>
      <div style={canvasWrapStyle}>
        <Canvas
          shadows
          camera={{ position: [0.4, 0.4, 0.6], fov: 45 }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
          data-testid="asset-review-canvas"
        >
          <color attach="background" args={['#1a1a1a']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <Suspense fallback={null}>
            <AssetWithClips url={url} kind={kind} />
          </Suspense>
          <gridHelper args={[1, 10, '#444', '#222']} />
          <OrbitControls makeDefault target={[0, 0, 0]} />
        </Canvas>
      </div>

      <aside style={sidebarStyle}>
        <SidebarHeader kind={kind} />
        <AssetControls url={url} kind={kind} />
      </aside>
    </main>
  );
};

// Drei's useGLTF + Zustand store have issues re-mounting across URL
// changes — easier to manage play state ourselves. Split loading (suspense)
// from controls (no suspense) so the scrubber can mount before the GLB
// arrives.

interface LoadedAsset {
  scene: THREE.Group;
  animations: readonly THREE.AnimationClip[];
}

const clipStore = new Map<
  string,
  {
    action: THREE.AnimationAction;
    mixer: THREE.AnimationMixer;
    duration: number;
  }
>();

const AssetWithClips = ({
  url,
  kind,
}: {
  url: string;
  kind: InteractiveAssetKind;
}): React.ReactElement => {
  const gltf = useGLTF(url) as unknown as LoadedAsset;
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const mixer = useMemo(() => {
    const m = new THREE.AnimationMixer(gltf.scene);
    mixerRef.current = m;
    return m;
  }, [gltf.scene]);

  // Register actions in the module-level store so the sidebar can drive them
  // without prop-drilling refs through Suspense boundaries.
  useEffect(() => {
    clipStore.clear();
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
      clipStore.set(`${kind}::${clip.name}`, {
        action,
        mixer,
        duration: clip.duration,
      });
    }
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
      clipStore.clear();
    };
  }, [mixer, gltf.animations, gltf.scene, kind]);

  useFrame((_, delta) => {
    mixer.update(delta);
  });

  return <primitive object={gltf.scene} />;
};

// --- Sidebar + controls -----------------------------------------------------

const SidebarHeader = ({
  kind,
}: {
  kind: InteractiveAssetKind;
}): React.ReactElement => {
  const c = INTERACTIVE_ASSET_CONTRACTS[kind];
  return (
    <>
      <Link href="/asset-review" style={backLinkStyle} prefetch={false}>
        ← all assets
      </Link>
      <h1 style={titleStyle}>{kind}</h1>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        {c.file}
      </div>
      <dl style={dlStyle}>
        <dt>Expected dims (m)</dt>
        <dd>
          {c.dimensions.x.toFixed(3)} × {c.dimensions.y.toFixed(3)} ×{' '}
          {c.dimensions.z.toFixed(3)} (±{c.dimensions.tolerance})
        </dd>
        <dt>Required nodes</dt>
        <dd>{c.requiredNodes.join(', ')}</dd>
        <dt>Required clips</dt>
        <dd>{c.requiredClips.join(', ') || '— (none required)'}</dd>
        <dt>Optional clips</dt>
        <dd>{c.optionalClips.join(', ') || '—'}</dd>
        <dt>Max bones</dt>
        <dd>{c.maxBones}</dd>
      </dl>
    </>
  );
};

const AssetControls = ({
  url,
  kind,
}: {
  url: string;
  kind: InteractiveAssetKind;
}): React.ReactElement => {
  void url;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  const entries = useMemo(() => {
    return Array.from(clipStore.entries()).filter(([k]) =>
      k.startsWith(`${kind}::`),
    );
  }, [kind, tick]);

  if (entries.length === 0) {
    return (
      <div style={emptyStateStyle}>
        <strong>No clips loaded.</strong>
        <p style={{ marginTop: 8 }}>
          If the GLB is missing, the asset will 404 in the canvas. Check that
          <code> public/scene/models/{INTERACTIVE_ASSET_CONTRACTS[kind].file}</code>
          {' '}exists.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={subheadingStyle}>Clips</h2>
      {entries.map(([fullName, entry]) => {
        const name = fullName.slice(kind.length + 2);
        return (
          <ClipRow
            key={fullName}
            name={name}
            action={entry.action}
            mixer={entry.mixer}
            duration={entry.duration}
          />
        );
      })}
    </div>
  );
};

const ClipRow = ({
  name,
  action,
  mixer,
  duration,
}: {
  name: string;
  action: THREE.AnimationAction;
  mixer: THREE.AnimationMixer;
  duration: number;
}): React.ReactElement => {
  const [scrub, setScrub] = useState(0);

  const play = (): void => {
    action.reset();
    action.loop = THREE.LoopOnce;
    action.play();
  };
  const loop = (): void => {
    action.reset();
    action.loop = THREE.LoopRepeat;
    action.play();
  };
  const stop = (): void => {
    action.stop();
    action.time = 0;
    mixer.update(0);
  };
  const onScrub = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = Number(e.target.value);
    setScrub(value);
    action.reset();
    action.play();
    action.paused = true;
    action.time = value;
    mixer.update(0);
  };

  return (
    <div style={clipRowStyle}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <strong style={{ fontFamily: 'monospace' }}>{name}</strong>
        <span style={{ opacity: 0.6, fontSize: 12 }}>
          {duration.toFixed(2)} s
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button type="button" onClick={play} style={buttonStyle}>
          play
        </button>
        <button type="button" onClick={loop} style={buttonStyle}>
          loop
        </button>
        <button type="button" onClick={stop} style={buttonStyle}>
          stop
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        step={duration / 200}
        value={scrub}
        onChange={onScrub}
        style={{ width: '100%', marginTop: 10 }}
      />
    </div>
  );
};

// --- Styles (inlined — this is a dev-only tool, no design tokens)

const panelStyle: React.CSSProperties = {
  minHeight: '100dvh',
  padding: 40,
  background: '#111',
  color: '#e8e2d4',
  fontFamily:
    'Inter Variable, system-ui, -apple-system, sans-serif',
  fontSize: 14,
};
const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 500,
  margin: 0,
  marginBottom: 8,
};
const subtitleStyle: React.CSSProperties = {
  opacity: 0.7,
  marginBottom: 24,
  lineHeight: 1.5,
};
const linkStyle: React.CSSProperties = {
  color: '#c77a3b',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '6px 0',
};
const viewerLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 360px',
  height: '100dvh',
  background: '#0a0a0a',
  color: '#e8e2d4',
  fontFamily:
    'Inter Variable, system-ui, -apple-system, sans-serif',
  fontSize: 13,
};
const canvasWrapStyle: React.CSSProperties = { position: 'relative' };
const sidebarStyle: React.CSSProperties = {
  padding: 24,
  borderLeft: '1px solid #222',
  overflowY: 'auto',
  background: '#111',
};
const backLinkStyle: React.CSSProperties = {
  color: '#c77a3b',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 16,
  fontSize: 12,
};
const dlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '4px 12px',
  margin: '16px 0',
  fontSize: 12,
};
const subheadingStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  borderTop: '1px solid #222',
  paddingTop: 16,
  marginTop: 16,
};
const clipRowStyle: React.CSSProperties = {
  padding: '12px 0',
  borderBottom: '1px solid #1e1e1e',
};
const buttonStyle: React.CSSProperties = {
  background: '#1e1e1e',
  color: '#e8e2d4',
  border: '1px solid #333',
  padding: '4px 10px',
  fontFamily: 'monospace',
  fontSize: 12,
  cursor: 'pointer',
  borderRadius: 2,
};
const emptyStateStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 4,
  fontSize: 12,
  lineHeight: 1.5,
};
