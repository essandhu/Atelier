import { describe, expect, it } from 'vitest';
import { POSES, type DockableKind } from '@/interaction/camera-dock/poses';
import type { ReadingPose } from '@/interaction/camera-dock/pose';

const ALL_KINDS: DockableKind[] = [
  'projectBook',
  'heroBook',
  'contactCard',
  'skillsCatalog',
];

const isFinite3 = (v: readonly number[]): boolean =>
  v.length === 3 && v.every((n) => Number.isFinite(n));

describe('camera-dock POSES table', () => {
  it('provides a ReadingPose for every dockable kind', () => {
    for (const kind of ALL_KINDS) {
      expect(POSES[kind], `missing pose for ${kind}`).toBeDefined();
    }
  });

  it.each(ALL_KINDS)('pose %s has finite 3-tuples for position/rotation', (kind) => {
    const pose: ReadingPose = POSES[kind];
    expect(isFinite3(pose.position)).toBe(true);
    expect(isFinite3(pose.rotation)).toBe(true);
  });

  it.each(ALL_KINDS)('pose %s names a non-empty surfaceNode', (kind) => {
    const pose: ReadingPose = POSES[kind];
    expect(typeof pose.surfaceNode).toBe('string');
    expect(pose.surfaceNode.length).toBeGreaterThan(0);
  });

  it.each(ALL_KINDS)('pose %s has positive DOM surface dimensions', (kind) => {
    const pose: ReadingPose = POSES[kind];
    expect(pose.domSize.w).toBeGreaterThan(0);
    expect(pose.domSize.h).toBeGreaterThan(0);
  });

  it('project-book and contact-card share the "held at chest" pose distance', () => {
    // Both docks present a card-sized surface tilted toward the viewer;
    // the X magnitude (off-centre offset) is allowed to differ, but the Z
    // distance — how close to the camera the object lands — matches so
    // the shared "held at chest" mental model reads consistently.
    expect(POSES.projectBook.position[2]).toBeCloseTo(
      POSES.contactCard.position[2],
      2,
    );
  });

  it('hero-book pose is shallower (smaller tilt) than project-book pose', () => {
    // The hero book is already open; it does not need as aggressive a
    // tilt toward the viewer as a freshly-docked project book.
    const heroTilt = Math.abs(POSES.heroBook.rotation[0]);
    const projectTilt = Math.abs(POSES.projectBook.rotation[0]);
    expect(heroTilt).toBeLessThan(projectTilt);
  });
});
