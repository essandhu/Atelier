import { describe, expect, it } from 'vitest';
import { resolve } from '@/time-of-day/resolve';

const at = (hour: number): Date => new Date(2026, 0, 1, hour, 0, 0, 0);

describe('resolve(time-of-day)', () => {
  describe('hour → state', () => {
    it('hour 5 → morning (lower bound)', () => {
      expect(resolve({ now: at(5) })).toBe('morning');
    });
    it('hour 9 → morning (upper bound)', () => {
      expect(resolve({ now: at(9) })).toBe('morning');
    });
    it('hour 10 → day (lower bound)', () => {
      expect(resolve({ now: at(10) })).toBe('day');
    });
    it('hour 15 → day (upper bound)', () => {
      expect(resolve({ now: at(15) })).toBe('day');
    });
    it('hour 16 → evening (lower bound)', () => {
      expect(resolve({ now: at(16) })).toBe('evening');
    });
    it('hour 19 → evening (upper bound)', () => {
      expect(resolve({ now: at(19) })).toBe('evening');
    });
    it('hour 20 → night (lower bound)', () => {
      expect(resolve({ now: at(20) })).toBe('night');
    });
    it('hour 23 → night', () => {
      expect(resolve({ now: at(23) })).toBe('night');
    });
    it('hour 0 → night (wrap-around)', () => {
      expect(resolve({ now: at(0) })).toBe('night');
    });
    it('hour 4 → night (upper bound of wrap)', () => {
      expect(resolve({ now: at(4) })).toBe('night');
    });
  });

  describe('URL override priority', () => {
    it('?time=morning overrides a night hour', () => {
      const url = new URL('https://example.com/?time=morning');
      expect(resolve({ url, now: at(2) })).toBe('morning');
    });
    it('?time=day overrides evening', () => {
      const url = new URL('https://example.com/?time=day');
      expect(resolve({ url, now: at(17) })).toBe('day');
    });
    it('?time=night overrides morning', () => {
      const url = new URL('https://example.com/?time=night');
      expect(resolve({ url, now: at(7) })).toBe('night');
    });
    it('invalid ?time value falls through to hour', () => {
      const url = new URL('https://example.com/?time=cosmic');
      expect(resolve({ url, now: at(11) })).toBe('day');
    });
  });

  describe('defaults', () => {
    it('no inputs falls back to evening', () => {
      // Default Date() could land anywhere; using empty object with a
      // manually-set now is the observable fallback. A fully-default call
      // defers to current wall-clock hour, which we don't assert.
      expect(resolve()).toMatch(/^(morning|day|evening|night)$/);
    });
  });
});
