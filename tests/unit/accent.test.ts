import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { getAccent, ACCENT_FALLBACK_HEX } from '@/ui/controls/accent';

describe('getAccent()', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to the seed accent when document is undefined (SSR/pre-hydration)', () => {
    vi.stubGlobal('document', undefined);
    const color = getAccent();
    const expected = new THREE.Color(ACCENT_FALLBACK_HEX);
    expect(color).toBeInstanceOf(THREE.Color);
    expect(color.getHexString()).toBe(expected.getHexString());
  });

  it('falls back when --accent CSS var is empty', () => {
    vi.stubGlobal('document', {
      documentElement: {} as HTMLElement,
    });
    vi.stubGlobal(
      'getComputedStyle',
      () => ({ getPropertyValue: () => '' }) as unknown as CSSStyleDeclaration,
    );
    const color = getAccent();
    expect(color.getHexString()).toBe(
      new THREE.Color(ACCENT_FALLBACK_HEX).getHexString(),
    );
  });

  it('parses the --accent CSS var when present', () => {
    vi.stubGlobal('document', {
      documentElement: {} as HTMLElement,
    });
    vi.stubGlobal(
      'getComputedStyle',
      () =>
        ({ getPropertyValue: () => '  #ff8844  ' }) as unknown as CSSStyleDeclaration,
    );
    const color = getAccent();
    expect(color.getHexString()).toBe(new THREE.Color('#ff8844').getHexString());
  });
});
