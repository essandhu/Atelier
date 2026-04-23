/**
 * Globe world-space placement + lat/lon → cartesian conversion.
 *
 * P10-14 desk rebalance — the globe moves from the back-right to the
 * front-left of the desk per architecture §8 Stage A deliverable 6, so the
 * book stack and lamp claim the right-hand composition and the globe
 * anchors the left. Desk centre at [0, 0.75, 0] with top surface at
 * y ≈ 0.79; the globe's stand sits at y = 0.86 with the sphere above it.
 * Keeping geometry constants here lets the ambient objects (coffee cup,
 * notes, plant) import the anchor so they don't overlap — same pattern as
 * `src/scene/project-books/stack-config.ts`.
 */
export const GLOBE_RADIUS = 0.08;

// Front-left of desk per P10-14, clear of the lamp + book stack.
export const GLOBE_POSITION: [number, number, number] = [-0.65, 0.86, 0.25];

/**
 * Convert latitude + longitude (degrees, WGS-84 convention) to a cartesian
 * offset on a sphere of the given radius, centered at the origin.
 *
 * Longitude 0°, latitude 0° maps to +Z (scene "front"); +lat is +Y (north
 * pole up); +lon rotates toward +X.
 */
export const markerCartesian = (
  latDeg: number,
  lonDeg: number,
  radius: number,
): [number, number, number] => {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const cosLat = Math.cos(lat);
  const x = radius * cosLat * Math.sin(lon);
  const y = radius * Math.sin(lat);
  const z = radius * cosLat * Math.cos(lon);
  return [x, y, z];
};
