/**
 * Scale an ambient-motion amplitude by the global reduced-motion flag.
 * Non-negative bases damp to 10% when reducedMotion is on; zero stays zero,
 * and negative bases pass through unchanged so callers can keep defensive
 * guards upstream.
 */
export const ambientAmplitudeFor = (
  reducedMotion: boolean,
  base: number,
): number => {
  if (base <= 0) return base;
  if (!reducedMotion) return base;
  return base * 0.1;
};
