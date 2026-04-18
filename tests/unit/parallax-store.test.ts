import { beforeEach, describe, expect, it } from 'vitest';
import { parallaxStore } from '@/store/parallax-store';

describe('parallax-store', () => {
  beforeEach(() => {
    parallaxStore.getState().reset();
  });

  it('starts at zero offset', () => {
    expect(parallaxStore.getState().offset).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('setOffset round-trips through the store', () => {
    parallaxStore.getState().setOffset({ x: 0.1, y: -0.2, z: 0.05 });
    expect(parallaxStore.getState().offset).toEqual({
      x: 0.1,
      y: -0.2,
      z: 0.05,
    });
  });

  it('reset zeroes a non-zero offset', () => {
    parallaxStore.getState().setOffset({ x: 1, y: 2, z: 3 });
    parallaxStore.getState().reset();
    expect(parallaxStore.getState().offset).toEqual({ x: 0, y: 0, z: 0 });
  });
});
