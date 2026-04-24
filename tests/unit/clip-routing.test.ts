// Unit tests for the scene-phase → animation-clip routing layer.
//
// The hook in `useObjectClips.ts` is the R3F wiring that executes these
// decisions; all decision logic lives here so it's testable without R3F.

import { describe, expect, it } from 'vitest';
import {
  resolveClipAction,
  type ClipContext,
  type ClipName,
} from '@/interaction/skinned-motion/clip-routing';

const ALL_CLIPS = new Set<ClipName>([
  'open',
  'close',
  'idle',
  'hover',
  'pageFlip',
]);

const baseCtx = (overrides: Partial<ClipContext> = {}): ClipContext => ({
  prev: null,
  next: 'closed',
  isActive: false,
  reducedMotion: false,
  available: ALL_CLIPS,
  ...overrides,
});

describe('clip-routing / active object', () => {
  it('plays `open` on entering docking', () => {
    const action = resolveClipAction(
      baseCtx({ prev: 'closed', next: 'docking', isActive: true }),
    );
    expect(action.kind).toBe('play');
    if (action.kind !== 'play') return;
    expect(action.clip).toBe('open');
    expect(action.loop).toBe(false);
  });

  it('plays `close` on entering closing', () => {
    const action = resolveClipAction(
      baseCtx({ prev: 'open', next: 'closing', isActive: true }),
    );
    expect(action.kind).toBe('play');
    if (action.kind !== 'play') return;
    expect(action.clip).toBe('close');
  });

  it('starts `idle` loop on entering open', () => {
    const action = resolveClipAction(
      baseCtx({ prev: 'opening', next: 'open', isActive: true }),
    );
    expect(action.kind).toBe('play');
    if (action.kind !== 'play') return;
    expect(action.clip).toBe('idle');
    expect(action.loop).toBe(true);
  });

  it('does nothing when phase does not change meaningfully', () => {
    const action = resolveClipAction(
      baseCtx({ prev: 'docking', next: 'docked', isActive: true }),
    );
    expect(action.kind).toBe('none');
  });
});

describe('clip-routing / passive object', () => {
  it('never plays `open` when not active', () => {
    const action = resolveClipAction(
      baseCtx({ prev: 'closed', next: 'docking', isActive: false }),
    );
    expect(action.kind).toBe('none');
  });

  it('fades out `open` on close transition (previously active)', () => {
    // Previously active object that just deactivated — fade its open
    // clip out so the pose returns to bind pose smoothly.
    const action = resolveClipAction(
      baseCtx({ prev: 'closing', next: 'closed', isActive: false }),
    );
    expect(action.kind).toBe('stop');
    if (action.kind !== 'stop') return;
    expect(action.clip).toBe('open');
  });
});

describe('clip-routing / reduced motion', () => {
  it('snaps `open` to end frame on docking', () => {
    const action = resolveClipAction(
      baseCtx({
        prev: 'closed',
        next: 'docking',
        isActive: true,
        reducedMotion: true,
      }),
    );
    expect(action.kind).toBe('snap-to-end');
    if (action.kind !== 'snap-to-end') return;
    expect(action.clip).toBe('open');
  });

  it('snaps `close` to end frame on closing', () => {
    const action = resolveClipAction(
      baseCtx({
        prev: 'open',
        next: 'closing',
        isActive: true,
        reducedMotion: true,
      }),
    );
    expect(action.kind).toBe('snap-to-end');
  });

  it('never starts idle loop in reduced motion', () => {
    const action = resolveClipAction(
      baseCtx({
        prev: 'opening',
        next: 'open',
        isActive: true,
        reducedMotion: true,
      }),
    );
    expect(action.kind).toBe('none');
  });
});

describe('clip-routing / missing clips', () => {
  it('gracefully does nothing when `open` is not in the asset', () => {
    const partial = new Set<ClipName>(['close']);
    const action = resolveClipAction(
      baseCtx({
        prev: 'closed',
        next: 'docking',
        isActive: true,
        available: partial,
      }),
    );
    expect(action.kind).toBe('none');
  });

  it('does not start idle loop when asset has no idle clip', () => {
    const partial = new Set<ClipName>(['open', 'close']);
    const action = resolveClipAction(
      baseCtx({
        prev: 'opening',
        next: 'open',
        isActive: true,
        available: partial,
      }),
    );
    expect(action.kind).toBe('none');
  });
});
