/**
 * Background geometry anchors.
 *
 * BACKGROUND_Z_CEILING is the most-positive Z any background mesh may
 * occupy. The desk surface sits between ~0 and ~0.7 in Z; -1.6 is clearly
 * outside that range, giving the background room to read as peripheral
 * even before Phase 10's depth-of-field pass lands.
 */

export const BACKGROUND_Z_CEILING = -1.6;

export const BOOKSHELF_POSITION: [number, number, number] = [1.6, 0.9, -2.2];
export const BOOKSHELF_SIZE: [number, number, number] = [1.6, 1.8, 0.3];

// Phase 10 brief §5.6 — square avatar frame on the centre back wall. The
// texture is authored from `public/scene/avatar.jpg` (P10-03 fetch script)
// with a runtime failover to the GitHub redirect URL.
export const WALL_PIECE_POSITION: [number, number, number] = [0.0, 1.75, -2.35];
export const WALL_PIECE_SIZE: [number, number] = [0.4, 0.4];

// Phase 10 §5.11 — corkboard pinboard hosting four live-activity cards.
// Sits below the avatar frame on the centre back wall. 2 cm deep so it
// reads as a real object under raking window light, 5 cm in front of the
// wall piece plane so the board + pins cast a subtle drop shadow.
export const PINBOARD_POSITION: [number, number, number] = [0.0, 1.25, -2.3];
export const PINBOARD_SIZE: [number, number, number] = [0.8, 0.5, 0.02];
