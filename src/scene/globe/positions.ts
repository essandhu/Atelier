/**
 * Globe world-space placement + lat/lon → cartesian conversion.
 *
 * The globe sits on the back-right of the desk (Desk center [0, 0.75, 0] with
 * top surface at y ≈ 0.79). Keeping geometry constants here lets the ambient
 * objects (coffee cup, notes) import the anchor so they don't overlap — same
 * pattern as `src/scene/project-books/stack-config.ts`.
 */
export const GLOBE_RADIUS = 0.08;

// Back-right of desk, clear of the book stack (§5.1 layout).
export const GLOBE_POSITION: [number, number, number] = [0.9, 0.86, -0.45];

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
