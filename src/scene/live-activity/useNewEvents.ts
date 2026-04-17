'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActivityEvent } from '@/data/github/types';

export const STORAGE_KEY = 'atelier.lastSeenEventIds';

// Pure diff used by both the hook and the unit tests. Treats any parse
// failure as a "first visit" (no known previous state), so a corrupted
// storage entry cannot strand the animation.
export const diffNewEventIds = (
  currentIds: string[],
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
): Set<string> => {
  if (!storage) return new Set();
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    storage.setItem(STORAGE_KEY, JSON.stringify(currentIds));
    return new Set();
  }
  let known: string[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((v) => typeof v !== 'string')) {
      throw new Error('shape');
    }
    known = parsed;
  } catch {
    storage.setItem(STORAGE_KEY, JSON.stringify(currentIds));
    return new Set();
  }
  const knownSet = new Set(known);
  const newIds = currentIds.filter((id) => !knownSet.has(id));
  if (newIds.length > 0) {
    const merged = Array.from(new Set([...known, ...currentIds]));
    storage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }
  return new Set(newIds);
};

const safeStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const useNewEvents = (events: ActivityEvent[]): Set<string> => {
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;
    const storage = safeStorage();
    const ids = events.map((e) => e.id);
    setNewIds(diffNewEventIds(ids, storage));
  }, [events]);

  return newIds;
};
