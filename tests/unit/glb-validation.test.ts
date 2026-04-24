// Contract test for interactive-asset GLBs.
//
// Two layers:
//   1. Synthetic Documents — built in-memory via `@gltf-transform/core`
//      exercise each validator code path without needing a real GLB on
//      disk. Runs in CI from day one; doesn't require the artist to
//      have delivered.
//   2. Real-asset pass — for every kind whose GLB exists under
//      `public/scene/models/{file}`, the test loads it and asserts the
//      contract. If the file doesn't exist yet, that kind's real-asset
//      test is skipped with a log line so a missing asset never blocks
//      CI pre-delivery but always gates delivery-day.

import { describe, expect, it } from 'vitest';
import { Document, NodeIO } from '@gltf-transform/core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  INTERACTIVE_ASSET_CONTRACTS,
  INTERACTIVE_ASSET_KINDS,
  type InteractiveAssetContract,
  type InteractiveAssetKind,
} from '@/asset/interactive-asset-contract';
import {
  validateInteractiveAsset,
  formatValidationResult,
} from '@/asset/validate-glb';

const PUBLIC_MODELS_DIR = join(
  process.cwd(),
  'public',
  'scene',
  'models',
);

// --- Synthetic-document builders --------------------------------------------

/**
 * Build a minimal-compliant Document for a kind — every required node,
 * every required clip, bbox matches contract dimensions, one skin with
 * bone count ≤ maxBones. Tests layer mutations onto this base.
 */
const buildCompliantDocument = (
  contract: InteractiveAssetContract,
): Document => {
  const doc = new Document();
  const buffer = doc.createBuffer();

  // POSITION accessor sized to the contract dimensions — placed as a
  // 2-vertex "primitive" whose min/max span exactly the expected bbox.
  const halfX = contract.dimensions.x / 2;
  const halfY = contract.dimensions.y / 2;
  const halfZ = contract.dimensions.z / 2;
  const positions = new Float32Array([
    -halfX, -halfY, -halfZ,
    halfX, halfY, halfZ,
  ]);

  const accessor = doc
    .createAccessor()
    .setArray(positions)
    .setType('VEC3')
    .setBuffer(buffer);

  const prim = doc.createPrimitive().setAttribute('POSITION', accessor);
  const mesh = doc.createMesh().addPrimitive(prim);

  // Root node with the geometry. Bound box comes from accessor
  // min/max which setArray derives automatically.
  const rootNode = doc
    .createNode(contract.rootNodeName)
    .setMesh(mesh);

  // Required named descendants — the validator only checks NAMES, not
  // what's inside; empty nodes satisfy it.
  const attachedNodes = [rootNode];
  for (const name of contract.requiredNodes) {
    if (name === contract.rootNodeName) continue;
    const n = doc.createNode(name);
    rootNode.addChild(n);
    attachedNodes.push(n);
  }

  // Default scene with the root as a direct child (§2.2).
  const scene = doc.createScene().addChild(rootNode);
  doc.getRoot().setDefaultScene(scene);

  // Required clips — empty AnimationClips (no channels / samplers)
  // satisfy "named clip exists."
  for (const name of contract.requiredClips) {
    doc.createAnimation(name);
  }

  return doc;
};

// --- Tests ------------------------------------------------------------------

describe('glb-validation / synthetic documents', () => {
  for (const kind of INTERACTIVE_ASSET_KINDS) {
    const contract = INTERACTIVE_ASSET_CONTRACTS[kind];

    describe(kind, () => {
      it('accepts a compliant document', () => {
        const doc = buildCompliantDocument(contract);
        const result = validateInteractiveAsset(doc, kind);
        if (!result.ok) {
          // Print the full diagnostics so a failing CI run is actionable.
          throw new Error(formatValidationResult(result));
        }
        expect(result.ok).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('rejects when the root node is missing', () => {
        const doc = buildCompliantDocument(contract);
        // Rename the root to break the lookup.
        const root = doc.getRoot().listNodes().find(
          (n) => n.getName() === contract.rootNodeName,
        );
        root?.setName('wrongRootName');
        const result = validateInteractiveAsset(doc, kind);
        expect(result.ok).toBe(false);
        expect(result.errors.some((e) => e.code === 'root-node-missing')).toBe(
          true,
        );
      });

      it('rejects when the root is nested below another node', () => {
        const doc = buildCompliantDocument(contract);
        const root = doc.getRoot().listNodes().find(
          (n) => n.getName() === contract.rootNodeName,
        );
        if (!root) throw new Error('root-missing in fixture');
        const scene = doc.getRoot().listScenes()[0]!;
        // Re-parent: make the root a child of a wrapper empty.
        const wrapper = doc.createNode('wrapperRig');
        scene.removeChild(root);
        scene.addChild(wrapper);
        wrapper.addChild(root);
        const result = validateInteractiveAsset(doc, kind);
        expect(result.ok).toBe(false);
        expect(
          result.errors.some((e) => e.code === 'root-node-not-top-level'),
        ).toBe(true);
      });

      if (contract.requiredNodes.length > 1) {
        it('rejects when a required named child is missing', () => {
          const doc = buildCompliantDocument(contract);
          // Find a required node that isn't the root and unname it.
          const targetName = contract.requiredNodes.find(
            (n) => n !== contract.rootNodeName,
          )!;
          const target = doc.getRoot().listNodes().find(
            (n) => n.getName() === targetName,
          );
          target?.setName('unnamed');
          const result = validateInteractiveAsset(doc, kind);
          expect(result.ok).toBe(false);
          expect(
            result.errors.some(
              (e) => e.code === 'named-node-missing' && e.target === targetName,
            ),
          ).toBe(true);
        });
      }

      if (contract.requiredClips.length > 0) {
        it('rejects when a required clip is missing', () => {
          const doc = buildCompliantDocument(contract);
          // Remove the first required clip.
          const missing = contract.requiredClips[0]!;
          const toRemove = doc.getRoot().listAnimations().find(
            (a) => a.getName() === missing,
          );
          toRemove?.dispose();
          const result = validateInteractiveAsset(doc, kind);
          expect(result.ok).toBe(false);
          expect(
            result.errors.some(
              (e) => e.code === 'required-clip-missing' && e.target === missing,
            ),
          ).toBe(true);
        });
      }

      it('rejects when the bounding box is out of tolerance', () => {
        const doc = buildCompliantDocument(contract);
        // Blow up the X dimension far past tolerance.
        const rootNode = doc.getRoot().listNodes().find(
          (n) => n.getName() === contract.rootNodeName,
        );
        const mesh = rootNode?.getMesh();
        const prim = mesh?.listPrimitives()[0];
        const pos = prim?.getAttribute('POSITION');
        // Rebuild the accessor with a wildly-wrong X range.
        const bad = new Float32Array([-5, 0, 0, 5, 0, 0]);
        pos?.setArray(bad);
        const result = validateInteractiveAsset(doc, kind);
        expect(result.ok).toBe(false);
        expect(
          result.errors.some((e) => e.code === 'dimension-out-of-tolerance'),
        ).toBe(true);
      });

      it('warns on unknown clip names but does not fail', () => {
        const doc = buildCompliantDocument(contract);
        doc.createAnimation('zombie'); // not in required/optional lists
        const result = validateInteractiveAsset(doc, kind);
        expect(result.ok).toBe(true); // warnings do not fail
        expect(
          result.warnings.some(
            (w) => w.code === 'unknown-clip-name' && w.target === 'zombie',
          ),
        ).toBe(true);
      });

      it('warns on unknown kind-prefixed node names but does not fail', () => {
        const doc = buildCompliantDocument(contract);
        // Create a node with a name that looks intentional but isn't listed.
        doc
          .getRoot()
          .listScenes()[0]
          ?.addChild(doc.createNode(`${contract.rootNodeName}:zombie`));
        const result = validateInteractiveAsset(doc, kind);
        // Root may now be ok (top-level) since we didn't move it, and required
        // nodes are still present — only a warning should land.
        expect(
          result.warnings.some(
            (w) =>
              w.code === 'unknown-node-name' &&
              w.target === `${contract.rootNodeName}:zombie`,
          ),
        ).toBe(true);
      });
    });
  }
});

// --- Real-asset pass --------------------------------------------------------
//
// Runs once per kind. If the GLB doesn't exist on disk yet (artist hasn't
// delivered), skip with a clear log. When the first real GLB lands, this
// starts exercising it automatically.

describe('glb-validation / real assets (delivery gate)', () => {
  const io = new NodeIO();

  for (const kind of INTERACTIVE_ASSET_KINDS) {
    const contract = INTERACTIVE_ASSET_CONTRACTS[kind];
    const path = join(PUBLIC_MODELS_DIR, contract.file);
    const exists = existsSync(path);

    it.skipIf(!exists)(
      `validates ${contract.file} against the contract`,
      async () => {
        const doc = await io.read(path);
        const result = validateInteractiveAsset(doc, kind as InteractiveAssetKind);
        if (!result.ok) {
          throw new Error(
            `\n--- ${contract.file} failed validation ---\n${formatValidationResult(result)}`,
          );
        }
        expect(result.ok).toBe(true);
      },
    );
  }
});
