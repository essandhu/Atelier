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
 * Layout (brief §5.3 / §5.5):
 * - Coffee cup  → front-left of the desk, opposite the lamp.
 * - Plant       → floor-standing, west of the desk on the window side
 *                 (outside the desk footprint). Stage-A placeholder per
 *                 brief §5.5 — the artist proposes the final XYZ.
 * - Pen         → artist's choice within the desk footprint, tilted so it
 *                 reads as "just put down" near the contact card.
 * - Contact card → front-centre card row, slightly right of the hero book.
 *                  Dockable (P10-11); replaced the retired `Notes` mesh.
 */

// Cup origin is the cylinder's centre, so y = desk surface + half cup height.
export const COFFEE_CUP_POSITION: [number, number, number] = [-0.3, 0.8, -0.05];

// Plant: floor-standing terracotta pot, west of the desk. Pot origin is the
// cylinder centre, so y = half the pot height (pot bottom at world y = 0,
// pot top at y ≈ 0.20). x sits beyond the desk's left edge (|x|>1.0) so the
// camera ray to the pot bypasses the desk slab on the left; z = -0.45 keeps
// the plant in the desk-depth zone so the line of sight from camera crosses
// y=0.79 forward of the desk's near face (under-desk visible through the
// gap), making the pot fully visible from below the desk-front edge. The
// upper foliage is partially occluded by the desk's top-left corner — which
// reads naturally as "plant tucked beside the desk". Stage-A placeholder
// per brief §5.5 — artist owns the final XYZ.
export const PLANT_POSITION: [number, number, number] = [-1.3, 0.1, -0.45];

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
