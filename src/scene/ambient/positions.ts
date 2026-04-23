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
 *                 reads as "just put down" near the contact card.
 * - Contact card → front-centre card row, slightly right of the hero book.
 *                  Dockable (P10-11); replaced the retired `Notes` mesh.
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

// Contact card: stray letterpress card in the front-centre card row
// (brief §5.3). Dockable via `useDockDriver(POSES.contactCard)` — the
// resting anchor here is the home pose the driver returns to on close.
// The mesh origin is at the card's planar top face for UV stability, so
// the y-coordinate is the desk surface plus a sliver for z-fight avoidance.
export const CONTACT_CARD_POSITION: [number, number, number] = [0.18, 0.79, 0.22];

// (width, thickness, depth) in metres. Footprint matches brief §5.3:
// ~0.10 × 0.15 m card with a 3.5 mm bevelled thickness.
export const CONTACT_CARD_SIZE: [number, number, number] = [0.1, 0.0035, 0.15];
