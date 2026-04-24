// Authoritative runtime contract for interactive-asset GLBs.
//
// This module is the single source of truth for named-node and
// named-clip validation. The artist brief (`docs/phase-10-artist-brief.md`
// §5.3.1–5.3.5) mirrors the human-readable version of these entries;
// when the two drift, this file wins for the runtime and the brief is
// updated to match.
//
// Every interactive dockable object kind has:
//   - A set of REQUIRED named nodes (root, cover/drawer/face/etc.,
//     surface anchor) — an artist's GLB that omits any of these fails
//     validation and does not mount into the scene.
//   - A set of REQUIRED named animation clips — `open` / `close` at
//     minimum for anything that docks; `pageFlip` / `idle` are
//     accepted when present but not required.
//   - A dimension envelope (bbox of the root) with ± tolerance. This
//     catches drift between the brief and the authored mesh before
//     the scene loads with visibly-wrong-sized geometry.
//   - A bone-count ceiling (mobile GPU uniform-packing constraint).
//
// The validator in `validate-glb.ts` reads this table; the asset
// review route's clip picker reads the same clip names. Keep this
// file and the contract doc in lockstep.

export type InteractiveAssetKind =
  | 'projectBook'
  | 'heroBook'
  | 'skillsCatalog'
  | 'contactCard'
  | 'globe';

export interface DimensionEnvelope {
  /** Metres — expected bbox size on each axis at the root, bind pose. */
  x: number;
  y: number;
  z: number;
  /** Absolute tolerance (metres) accepted on each axis. */
  tolerance: number;
}

export interface InteractiveAssetContract {
  kind: InteractiveAssetKind;
  /** The file the runtime fetches from `public/scene/models/{file}`. */
  file: string;
  /** Top-level node name inside the GLB's root scene. */
  rootNodeName: string;
  /** Named nodes that MUST exist on the root scene. */
  requiredNodes: readonly string[];
  /** Named nodes that MAY exist — listed so validation doesn't warn on them. */
  optionalNodes: readonly string[];
  /** Clip names that MUST exist. */
  requiredClips: readonly string[];
  /**
   * Clip names that MAY exist. Clips not in required+optional produce a
   * warning (not a failure) — artists can ship polish variants ahead
   * of runtime support, but unexpected names usually mean a typo.
   */
  optionalClips: readonly string[];
  /** Bbox envelope at bind pose. */
  dimensions: DimensionEnvelope;
  /** Hard ceiling on the skeleton's bone count. */
  maxBones: number;
}

/**
 * ONLY add/remove/rename entries here coordinated with the artist
 * brief (`docs/phase-10-artist-brief.md` §5.3.1–5.3.5) — the GLB
 * loader expects exact string matches. Renames are breaking changes
 * for in-flight artist work.
 */
export const INTERACTIVE_ASSET_CONTRACTS: Readonly<
  Record<InteractiveAssetKind, InteractiveAssetContract>
> = {
  projectBook: {
    kind: 'projectBook',
    file: 'projectBook.glb',
    rootNodeName: 'projectBook',
    requiredNodes: [
      'projectBook',
      'projectBook:cover',
      'projectBook:back',
      'projectBook:spine',
      'projectBook:pages',
      'projectBook:page',
    ],
    optionalNodes: [],
    requiredClips: ['open', 'close'],
    optionalClips: ['idle', 'hover', 'pageFlip', 'open.v2', 'open.v3'],
    dimensions: { x: 0.2, y: 0.022, z: 0.16, tolerance: 0.015 },
    maxBones: 16,
  },
  heroBook: {
    kind: 'heroBook',
    file: 'heroBook.glb',
    rootNodeName: 'heroBook',
    requiredNodes: [
      'heroBook',
      'heroBook:cover',
      'heroBook:back',
      'heroBook:leftPage',
      'heroBook:rightPage',
      'heroBook:page',
    ],
    optionalNodes: ['heroBook:ribbon'],
    requiredClips: ['open', 'close'],
    optionalClips: ['idle', 'pageFlip', 'ribbonSway'],
    // Authored open; bbox is the spread width × thickness × depth.
    dimensions: { x: 0.32, y: 0.02, z: 0.24, tolerance: 0.02 },
    maxBones: 24,
  },
  skillsCatalog: {
    kind: 'skillsCatalog',
    file: 'skillsCatalog.glb',
    rootNodeName: 'skillsCatalog',
    requiredNodes: [
      'skillsCatalog',
      'skillsCatalog:housing',
      'skillsCatalog:drawer',
    ],
    optionalNodes: [],
    requiredClips: ['open', 'close'],
    optionalClips: ['hover'],
    dimensions: { x: 0.18, y: 0.08, z: 0.12, tolerance: 0.01 },
    maxBones: 4,
  },
  contactCard: {
    kind: 'contactCard',
    file: 'contactCard.glb',
    rootNodeName: 'contactCard',
    requiredNodes: ['contactCard', 'contactCard:face'],
    optionalNodes: [],
    requiredClips: ['open', 'close'],
    optionalClips: ['idle'],
    dimensions: { x: 0.1, y: 0.003, z: 0.15, tolerance: 0.005 },
    maxBones: 2,
  },
  globe: {
    kind: 'globe',
    file: 'globe.glb',
    rootNodeName: 'globe',
    requiredNodes: ['globe', 'globe:sphere', 'globe:stand'],
    optionalNodes: [],
    // Globe has no docking — sphere is drag-to-spin. `idle` is the only
    // authored motion (stand wobble). No required clips.
    requiredClips: [],
    optionalClips: ['idle'],
    // Root bbox covers stand + sphere together.
    dimensions: { x: 0.16, y: 0.14, z: 0.16, tolerance: 0.02 },
    maxBones: 4,
  },
};

export const INTERACTIVE_ASSET_KINDS = Object.keys(
  INTERACTIVE_ASSET_CONTRACTS,
) as readonly InteractiveAssetKind[];
