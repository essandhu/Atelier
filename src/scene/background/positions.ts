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

export const WALL_PIECE_POSITION: [number, number, number] = [0.0, 1.7, -2.35];
export const WALL_PIECE_SIZE: [number, number] = [0.6, 0.4];
