// ReadingPose type — the target transform a dockable object springs to
// when the visitor opens it (§5.5, architecture.md). Docks are authored
// per-object in `poses.ts` and consumed by the shared driver
// (`driver.ts`) + `<Html transform>` surface helper (`surface.ts`).
//
// Coordinate system: world-space metres. The camera sits at
// (0, 1.5, 2.2) looking toward (0, 0.9, 0) — a "held at chest" pose
// ≈ 0.6 m from the camera along the view direction lands near
// (0, 1.3, 1.6). Fine-tuning happens visually at wire-up (P10-16).

export interface ReadingPose {
  // World-space target position for the object's group origin.
  position: readonly [number, number, number];
  // Euler (XYZ, radians) target rotation applied to the group.
  rotation: readonly [number, number, number];
  // Named mesh child whose local frame carries the <Html transform>.
  surfaceNode: string;
  // DOM pixel size of the rendered surface. Capped so legibility wins
  // over metaphor — the panel body is the authoritative a11y tree
  // regardless of presentation.
  domSize: { w: number; h: number };
}
