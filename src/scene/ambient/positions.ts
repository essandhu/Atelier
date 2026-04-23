/**
 * Ambient desk-object world-space anchors.
 *
 * P10-14 centralises every ambient anchor in a single module so composition
 * changes are one-file edits (same pattern as `src/scene/globe/positions.ts`
 * and `src/scene/background/positions.ts`). The desk surface sits at
 * y ≈ 0.79; each y-coordinate below is either at the surface (for meshes
 * whose origin is at their base) or offset by a half-height for cylinder /
 * box primitives authored around their centre.
 *
 * Layout (brief §5.3):
 * - Coffee cup  → front-left of the desk, opposite the lamp.
 * - Plant       → back-left floor anchor (outside the desk footprint).
 * - Pen         → artist's choice within the desk footprint, tilted so it
 *                 reads as "just put down" on the page of notes.
 * - Notes       → front-centre, tucked under the main reading light.
 */

// Cup origin is the cylinder's centre, so y = desk surface + half cup height.
export const COFFEE_CUP_POSITION: [number, number, number] = [-0.3, 0.8, -0.05];

// Plant sits on the floor, not the desk — kept at its prior anchor since the
// new front-left globe doesn't overlap it (plant is at |x| = 0.7, globe is
// at |x| = 0.65 but at +Z=0.25 vs plant's -Z=-0.3).
export const PLANT_POSITION: [number, number, number] = [-0.7, 0.8, -0.3];

// Pen: centred-ish within the desk footprint, tilted 25° around Y so it
// doesn't read as perfectly-aligned-with-desk-edge (which looks staged).
export const PEN_POSITION: [number, number, number] = [0.12, 0.793, 0.18];

// Notes sit just above the desk surface (paper thickness negligible).
export const NOTES_POSITION: [number, number, number] = [0.25, 0.792, 0.22];
