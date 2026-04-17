'use client';

import { useEffect, useState } from 'react';

/**
 * `matchMedia`-driven hook. SSR-safe (`false` on the server).
 */
export const useIsNarrowViewport = (maxWidth = 480): boolean => {
  const [narrow, setNarrow] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setNarrow(mql.matches);
    const handler = (ev: MediaQueryListEvent): void => setNarrow(ev.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [maxWidth]);

  return narrow;
};
