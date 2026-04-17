'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

const LightmapContext = createContext<THREE.Texture | null>(null);

export const useLightmap = (): THREE.Texture | null =>
  useContext(LightmapContext);

export interface LightmapsProps {
  state: TimeOfDayState;
  children?: React.ReactNode;
}

const BASIS_TRANSCODER_PATH = '/basis/';

export const Lightmaps = ({
  state,
  children,
}: LightmapsProps): React.ReactElement => {
  const url = presets[state].lightmap;
  const gl = useThree((s) => s.gl);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedTexture: THREE.Texture | null = null;
    let loader: KTX2Loader | null = null;

    const load = async (): Promise<void> => {
      const head = await fetch(url, { method: 'HEAD' }).catch(() => null);
      if (!head || !head.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[Lightmaps] ${url} not present — rendering without lightmap.`,
          );
        }
        return;
      }
      loader = new KTX2Loader()
        .setTranscoderPath(BASIS_TRANSCODER_PATH)
        .detectSupport(gl);
      const next = await loader.loadAsync(url);
      if (cancelled) {
        next.dispose();
        return;
      }
      next.flipY = false;
      next.channel = 1;
      loadedTexture = next;
      setTexture(next);
    };

    void load();
    return () => {
      cancelled = true;
      loader?.dispose();
      loadedTexture?.dispose();
    };
  }, [url, gl]);

  return (
    <LightmapContext.Provider value={texture}>
      {children}
    </LightmapContext.Provider>
  );
};
