import type { ReadingPose } from '@/interaction/camera-dock/pose';

// Dockable object kinds (§5.5). The non-dockable pair (globe, pinboard)
// does not appear here — they route directly to the 2D PanelFrame.
export type DockableKind =
  | 'projectBook'
  | 'heroBook'
  | 'contactCard'
  | 'skillsCatalog';

// "Held at chest" reading pose shared by project books + contact card:
// ≈ 0.6 m from camera along the view direction, spine (card long edge)
// parallel to the view plane, tilted ~15° toward the viewer. With the
// camera at (0, 1.5, 2.2) looking at (0, 0.9, 0), that lands near
// (0, 1.3, 1.6) before the per-object X offset.
const HELD_AT_CHEST_Z = 1.6;
const HELD_AT_CHEST_Y = 1.3;
const HELD_AT_CHEST_TILT_X = (-15 * Math.PI) / 180; // negative tilts top toward camera

export const POSES: Record<DockableKind, ReadingPose> = {
  // Books lift from the stack and tilt toward the viewer. Off-centre to
  // the right so the hero book remains visible on the left while a
  // project book is open.
  projectBook: {
    position: [0.12, HELD_AT_CHEST_Y, HELD_AT_CHEST_Z],
    rotation: [HELD_AT_CHEST_TILT_X, 0, 0],
    surfaceNode: 'projectBook:page',
    // Roughly 2:3 portrait — matches the visible open-book aspect.
    domSize: { w: 420, h: 560 },
  },

  // Hero book is already open at rest; its dock is shallower (the book
  // only needs to lift + gently tilt, not flip from spine-vertical).
  heroBook: {
    position: [0, HELD_AT_CHEST_Y, HELD_AT_CHEST_Z],
    rotation: [(-6 * Math.PI) / 180, 0, 0],
    surfaceNode: 'heroBook:page',
    domSize: { w: 520, h: 620 },
  },

  // Contact card lifts off the desk and hovers near the camera at the
  // same depth as the project book; off-centre to the left balances
  // against the project-book dock offset.
  contactCard: {
    position: [-0.12, HELD_AT_CHEST_Y, HELD_AT_CHEST_Z],
    rotation: [HELD_AT_CHEST_TILT_X, 0, 0],
    surfaceNode: 'contactCard:face',
    // Card aspect — wider than tall.
    domSize: { w: 460, h: 320 },
  },

  // Skills catalog presents the drawer-extended front face. The drawer
  // slide retains the §6.2 / §8 Phase 6 animation; the dock pose is the
  // resting target once the drawer is fully extended.
  skillsCatalog: {
    position: [0, HELD_AT_CHEST_Y - 0.05, HELD_AT_CHEST_Z + 0.1],
    rotation: [(-10 * Math.PI) / 180, 0, 0],
    surfaceNode: 'skillsCatalog:drawer',
    domSize: { w: 520, h: 420 },
  },
} as const;
