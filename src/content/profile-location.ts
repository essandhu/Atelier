/**
 * Latitude / longitude for `profile.location`. Hand-authored because the
 * profile string is a free-form marketing phrase ("Texas, United States"), not
 * a geocoding input. Updating the profile string requires a paired update
 * here — keep the label in sync.
 */
export interface LocationCoordinates {
  lat: number;
  lon: number;
  label: string;
}

// Rough centroid of Texas (~31.0°N, 100.0°W). Precise county isn't relevant —
// the globe tag is a "based in…" vibe, not a pin-drop.
export const locationCoordinates: LocationCoordinates = {
  lat: 31.0,
  lon: -100.0,
  label: 'Texas, United States',
};
