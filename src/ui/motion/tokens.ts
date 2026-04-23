// Motion tokens — single source of truth for animation duration and easing.
// Sourced verbatim from architecture.md §5.4. `as const` is required so
// Framer Motion narrows the cubic-bezier tuples correctly.

export const durations = {
  fast: 150,
  med: 250,
  slow: 400,
  panel: 700,
  bookOpen: 800,
  // Camera-dock spring settle window (§5.5). The spring driver uses τ ≈ 200 ms
  // critically-damped so ~97% of settle has occurred by this time.
  cameraDock: 700,
  // Reduced-motion: snap to the dock pose in one frame (§11.5).
  cameraDockReduced: 0,
} as const;

export const easings = {
  uiIn: [0.22, 1.0, 0.36, 1.0],
  uiOut: [0.64, 0.0, 0.78, 0.0],
  scene3d: [0.34, 0.0, 0.34, 1.0],
} as const;
