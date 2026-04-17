import { describe, expect, it, beforeEach, vi } from 'vitest';
import { diffNewEventIds, STORAGE_KEY } from '@/scene/live-activity/useNewEvents';

const makeStorage = () => {
  const backing = new Map<string, string>();
  return {
    getItem: vi.fn((k: string) => backing.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => {
      backing.set(k, v);
    }),
    removeItem: vi.fn((k: string) => {
      backing.delete(k);
    }),
    clear: vi.fn(() => backing.clear()),
    key: vi.fn(() => null),
    get length() {
      return backing.size;
    },
    _backing: backing,
  };
};

describe('diffNewEventIds', () => {
  let storage: ReturnType<typeof makeStorage>;

  beforeEach(() => {
    storage = makeStorage();
  });

  it('first visit (no key present) returns an empty set and persists silently', () => {
    const current = ['a', 'b', 'c'];
    const result = diffNewEventIds(current, storage);
    expect([...result]).toEqual([]);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage._backing.get(STORAGE_KEY) ?? '[]')).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('return visit with 3 new + 5 carryover returns exactly the 3 new ids', () => {
    storage._backing.set(STORAGE_KEY, JSON.stringify(['a', 'b', 'c', 'd', 'e']));
    const current = ['f', 'a', 'g', 'b', 'h', 'c', 'd', 'e'];
    const result = diffNewEventIds(current, storage);
    expect([...result].sort()).toEqual(['f', 'g', 'h']);
    expect(
      JSON.parse(storage._backing.get(STORAGE_KEY) ?? '[]').sort(),
    ).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].sort());
  });

  it('return visit with identical ids returns an empty set', () => {
    storage._backing.set(STORAGE_KEY, JSON.stringify(['a', 'b', 'c']));
    const result = diffNewEventIds(['a', 'b', 'c'], storage);
    expect([...result]).toEqual([]);
  });

  it('tolerates a corrupt stored value and treats it as first visit', () => {
    storage._backing.set(STORAGE_KEY, 'not-json');
    const result = diffNewEventIds(['a'], storage);
    expect([...result]).toEqual([]);
  });

  it('returns empty set without throwing when storage is null (SSR)', () => {
    const result = diffNewEventIds(['a', 'b'], null);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });
});
