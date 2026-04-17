import * as THREE from 'three';

export const ACCENT_FALLBACK_HEX = '#c77a3b';

export const getAccent = (): THREE.Color => {
  if (typeof document === 'undefined') {
    return new THREE.Color(ACCENT_FALLBACK_HEX);
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent')
    .trim();
  if (raw.length === 0) {
    return new THREE.Color(ACCENT_FALLBACK_HEX);
  }
  return new THREE.Color(raw);
};
