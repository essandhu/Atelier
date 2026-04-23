/**
 * Hero-book world-space anchors.
 *
 * P10-09 replaces the retired `LiveActivityBook` with a desk-centre
 * hero book that presents Atelier as the entry project (brief §5.3):
 * open tilted hardcover, spine along local Y, pages fan ~10° off the
 * desk plane. The former live-activity GitHub surface moved to the
 * wall pinboard (§5.11) + events-feed panel — see the checklist rows
 * describing the re-host.
 *
 * Desk surface sits at y ≈ 0.79; the book's origin is at the spine
 * centre, half a cover-thickness above the surface (negligible for
 * world-space lookups).
 */

// (x, y, z) in metres. Desk-centre, slightly forward of origin.
export const HERO_BOOK_POSITION: [number, number, number] = [-0.05, 0.79, 0.05];

// Euler (XYZ, radians). A shallow Y-yaw so the spine doesn't read
// exactly parallel to the desk edge — matches the "just placed" feel
// from the prior LiveActivityBook composition without the +X tilt
// that belongs to the dock pose.
export const HERO_BOOK_ROTATION: [number, number, number] = [0, 0.08, 0];

// Open-book footprint: (spreadWidth, coverThickness, pageDepth).
// With `SPINE_ALONG_Y` the spine is the thin local-Y dimension; the
// two pages fan symmetrically along local X from the spine centre.
export const HERO_BOOK_SIZE: [number, number, number] = [0.42, 0.008, 0.27];

// Page-fan tilt off the desk plane (radians). ~10° reads as an open
// book rather than a closed hardcover laid flat.
export const HERO_PAGE_FAN_RAD = (10 * Math.PI) / 180;
