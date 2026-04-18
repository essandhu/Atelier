/**
 * Skills catalog world-space placement. Mirrors the pattern in
 * `src/scene/globe/positions.ts` so ambient objects (coffee cup, notes)
 * can import the anchor and avoid geometry overlap.
 *
 * Positioned between the LiveActivityBook hero (x ≈ -0.05) and the globe
 * (x = +0.9), slightly forward of the book so the card faces read from
 * the camera.
 */
export const SKILLS_CATALOG_POSITION: [number, number, number] = [
  0.45,
  0.83,
  -0.15,
];

export const SKILLS_CATALOG_SIZE: [number, number, number] = [
  0.18, // width  (long edge — landscape orientation)
  0.08, // height (front face)
  0.12, // depth
];
