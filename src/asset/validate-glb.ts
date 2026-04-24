// Pure-logic validator for interactive-asset GLBs.
//
// Reads a `@gltf-transform/core` Document (the artist's exported GLB)
// and returns a structured result listing violations of the contract
// in `interactive-asset-contract.ts`. Runs both as a Node-side Vitest
// (no WebGL) and — via the same Document abstraction — at runtime
// load time after `GLTFLoader` delegates to `@gltf-transform` for
// validation-only reads.
//
// Design notes:
// - Pure function over a `Document` → no I/O here. Callers fetch + parse
//   the GLB, pass the Document in, and decide what to do with the
//   result. Keeps the function trivially unit-testable.
// - Errors are accumulated, not thrown. A GLB may miss several
//   contract entries at once; returning them all in one pass beats
//   forcing the artist through an iterative fail-fix-fail cycle.
// - Warnings are separate from errors. Unknown clip names warn (likely
//   typos or polish variants) but do not fail the load.

import type { Document, Node } from '@gltf-transform/core';
import {
  INTERACTIVE_ASSET_CONTRACTS,
  type InteractiveAssetContract,
  type InteractiveAssetKind,
} from './interactive-asset-contract';

export interface ValidationError {
  code:
    | 'root-node-missing'
    | 'root-node-not-top-level'
    | 'named-node-missing'
    | 'required-clip-missing'
    | 'dimension-out-of-tolerance'
    | 'bone-count-exceeded';
  message: string;
  /** Specific entity the error refers to (node name, clip name, axis). */
  target?: string;
}

export interface ValidationWarning {
  code: 'unknown-clip-name' | 'unknown-node-name';
  message: string;
  target: string;
}

export interface ValidationResult {
  kind: InteractiveAssetKind;
  ok: boolean;
  errors: readonly ValidationError[];
  warnings: readonly ValidationWarning[];
}

/**
 * Validate a parsed glTF document against the contract for a given kind.
 *
 * The caller owns I/O. Typical wiring:
 *   ```ts
 *   const io = new NodeIO(); // Node side
 *   const doc = await io.read(glbPath);
 *   const result = validateInteractiveAsset(doc, 'projectBook');
 *   if (!result.ok) throw new Error(formatValidationResult(result));
 *   ```
 */
export const validateInteractiveAsset = (
  doc: Document,
  kind: InteractiveAssetKind,
): ValidationResult => {
  const contract = INTERACTIVE_ASSET_CONTRACTS[kind];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const root = doc.getRoot();
  const scenes = root.listScenes();
  const scene = scenes[0]; // glTF default scene — the artist ships one

  const nodes = root.listNodes();
  const nodeByName = new Map(
    nodes.map((n) => [n.getName(), n] as const),
  );

  // --- Root-node checks -----------------------------------------------------

  const rootNode = nodeByName.get(contract.rootNodeName);
  if (!rootNode) {
    errors.push({
      code: 'root-node-missing',
      message: `Root node "${contract.rootNodeName}" not found. The GLB must contain a top-level node with this exact name.`,
      target: contract.rootNodeName,
    });
  } else if (scene) {
    // §2.2: the root node is the single top-level object in the scene.
    // Reject GLBs that nest it inside a parent rig (which would silently
    // re-break the world-space dock transform bug from P10-18).
    const topLevelNodes = scene.listChildren();
    const isTopLevel = topLevelNodes.some((n) => n === rootNode);
    if (!isTopLevel) {
      errors.push({
        code: 'root-node-not-top-level',
        message: `Root node "${contract.rootNodeName}" exists but is nested inside another node. Asset-contract §2.2 requires the root to be a direct child of the default scene.`,
        target: contract.rootNodeName,
      });
    }
  }

  // --- Named-node checks ----------------------------------------------------

  for (const name of contract.requiredNodes) {
    if (!nodeByName.has(name)) {
      errors.push({
        code: 'named-node-missing',
        message: `Required named node "${name}" not found in ${contract.file}.`,
        target: name,
      });
    }
  }

  const allowedNames = new Set<string>([
    ...contract.requiredNodes,
    ...contract.optionalNodes,
  ]);
  for (const node of nodes) {
    const name = node.getName();
    // A name is "contract-shaped" if it matches kind or kind: prefix —
    // anything prefixed with the contract's kind is clearly intended as
    // a named addressable node. Non-prefixed internal nodes (bones,
    // meshes) are ignored.
    if (
      !allowedNames.has(name) &&
      (name === contract.rootNodeName ||
        name.startsWith(`${contract.rootNodeName}:`))
    ) {
      warnings.push({
        code: 'unknown-node-name',
        message: `Node "${name}" is not listed in the contract's required or optional nodes. Either the contract needs updating or this is a typo.`,
        target: name,
      });
    }
  }

  // --- Animation-clip checks ------------------------------------------------

  const animations = root.listAnimations();
  const clipNames = new Set(animations.map((a) => a.getName()));

  for (const required of contract.requiredClips) {
    if (!clipNames.has(required)) {
      errors.push({
        code: 'required-clip-missing',
        message: `Required animation clip "${required}" not found in ${contract.file}.`,
        target: required,
      });
    }
  }

  const allowedClips = new Set<string>([
    ...contract.requiredClips,
    ...contract.optionalClips,
  ]);
  for (const clip of animations) {
    const name = clip.getName();
    if (!allowedClips.has(name)) {
      warnings.push({
        code: 'unknown-clip-name',
        message: `Animation "${name}" is not listed in the contract. Either the contract needs updating or this is a typo.`,
        target: name,
      });
    }
  }

  // --- Dimension envelope ---------------------------------------------------

  if (rootNode) {
    const bbox = computeBoundingBox(rootNode);
    if (bbox) {
      const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
      for (const axis of axes) {
        const expected = contract.dimensions[axis];
        const tolerance = contract.dimensions.tolerance;
        const actual = bbox[axis];
        if (Math.abs(actual - expected) > tolerance) {
          errors.push({
            code: 'dimension-out-of-tolerance',
            message: `Bbox ${axis}-size ${actual.toFixed(3)} m differs from contract ${expected.toFixed(3)} m by more than ${tolerance} m tolerance.`,
            target: axis,
          });
        }
      }
    }
  }

  // --- Bone count -----------------------------------------------------------

  const skins = root.listSkins();
  for (const skin of skins) {
    const boneCount = skin.listJoints().length;
    if (boneCount > contract.maxBones) {
      errors.push({
        code: 'bone-count-exceeded',
        message: `Skin has ${boneCount} bones; contract ceiling is ${contract.maxBones} (mobile GPU uniform-packing).`,
        target: skin.getName() || '<unnamed skin>',
      });
    }
  }

  return {
    kind,
    ok: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Format a validation result as a human-readable multi-line string.
 * Runtime error paths throw this; the asset-review route renders it as
 * a styled diagnostics panel.
 */
export const formatValidationResult = (result: ValidationResult): string => {
  const lines: string[] = [];
  lines.push(
    `GLB validation for kind="${result.kind}" — ${result.ok ? 'OK' : 'FAILED'}`,
  );
  if (result.errors.length > 0) {
    lines.push('Errors:');
    for (const e of result.errors) {
      lines.push(`  [${e.code}] ${e.message}`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of result.warnings) {
      lines.push(`  [${w.code}] ${w.message}`);
    }
  }
  return lines.join('\n');
};

/**
 * Walk a node's mesh primitives and the mesh primitives of its
 * descendants, returning the axis-aligned bounding box in the node's
 * local frame (metres). Returns null if the node has no geometry.
 *
 * We compute the bbox directly from position accessor min/max metadata
 * rather than iterating every vertex — glTF accessors carry those
 * values and they're authoritative for the bind pose.
 */
const computeBoundingBox = (
  rootNode: Node,
): { x: number; y: number; z: number } | null => {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let touched = false;

  const walk = (
    node: Node,
    translate: [number, number, number],
  ): void => {
    const mesh = node.getMesh();
    const [tx, ty, tz] = translate;
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        const position = prim.getAttribute('POSITION');
        if (!position) continue;
        const primMin = position.getMin([0, 0, 0]);
        const primMax = position.getMax([0, 0, 0]);
        minX = Math.min(minX, primMin[0] + tx);
        minY = Math.min(minY, primMin[1] + ty);
        minZ = Math.min(minZ, primMin[2] + tz);
        maxX = Math.max(maxX, primMax[0] + tx);
        maxY = Math.max(maxY, primMax[1] + ty);
        maxZ = Math.max(maxZ, primMax[2] + tz);
        touched = true;
      }
    }

    for (const child of node.listChildren()) {
      const local = child.getTranslation();
      walk(child, [tx + local[0], ty + local[1], tz + local[2]]);
    }
  };

  walk(rootNode, rootNode.getTranslation() as [number, number, number]);

  if (!touched) return null;
  return {
    x: maxX - minX,
    y: maxY - minY,
    z: maxZ - minZ,
  };
};

/**
 * Test-facing re-export for use in contract tests that construct
 * synthetic glTF documents in-memory to exercise the validator without
 * a real GLB on disk.
 */
export const __testing_helpers = {
  computeBoundingBox,
};

export type { InteractiveAssetContract };
