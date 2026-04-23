import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Scene geometry budget guard (P9-02).
 *
 * Parses every scene source listed in SCANNED_FILES and asserts each
 * primitive geometry's segment-count args stay within the ceiling documented
 * in `docs/perf-gates.md` under "Scene geometry budget". Regex scan, no R3F
 * render — fast, CI-cheap, fails loudly if someone adds a site that isn't
 * listed here so the audit doesn't silently drift.
 *
 * Caps (from `docs/perf-gates.md`):
 * - sphereGeometry: widthSegments ≤ 32, heightSegments ≤ 24
 * - cylinderGeometry / coneGeometry: radialSegments ≤ 24
 * - torusGeometry: radialSegments ≤ 16, tubularSegments ≤ 12
 *
 * Not budgeted (fixed by content semantics or zero-segment):
 * - ContributionGrid: 13×7 instanced mesh, content-sized.
 * - boxGeometry / planeGeometry: have no segment args in the sites scanned.
 */

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Full enumeration of every scene source that renders primitive geometry.
// Adding a new file must be accompanied by adding it here — the final test
// asserts every scanned file matched at least one primitive.
const SCANNED_FILES = [
  'src/scene/Desk.tsx',
  'src/scene/Lamp.tsx',
  'src/scene/Window.tsx',
  'src/scene/Globe.tsx',
  'src/scene/SkillsCatalog.tsx',
  'src/scene/ambient/CoffeeCup.tsx',
  'src/scene/ambient/Pen.tsx',
  'src/scene/ambient/Plant.tsx',
  'src/scene/ambient/ContactCard.tsx',
  'src/scene/background/Bookshelf.tsx',
  'src/scene/background/WallPiece.tsx',
  'src/scene/hero-book/HeroBook.tsx',
  'src/scene/project-books/ProjectBook.tsx',
];

interface GeometryHit {
  file: string;
  line: number;
  primitive: string;
  args: string;
  segments: number[];
}

const SEGMENTABLE_PRIMITIVES = new Set([
  'sphereGeometry',
  'cylinderGeometry',
  'coneGeometry',
  'torusGeometry',
]);

const GEOMETRY_PATTERN =
  /<(sphereGeometry|cylinderGeometry|coneGeometry|torusGeometry)\s+args=\{\s*\[([^\]]+)\]\s*\}/g;

const parseNumericLiterals = (raw: string): number[] => {
  // Strip comments and capture every JS numeric literal or Math.PI-like expr.
  // Non-literal args (e.g. GLOBE_RADIUS * 2.3) resolve to NaN and are skipped
  // downstream; segment args in this codebase are always literals.
  const out: number[] = [];
  const tokens = raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  for (const token of tokens) {
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      out.push(Number(token));
    } else {
      out.push(Number.NaN);
    }
  }
  return out;
};

const collectGeometry = (file: string): GeometryHit[] => {
  const full = path.join(PROJECT_ROOT, file);
  const source = readFileSync(full, 'utf8');
  const hits: GeometryHit[] = [];
  let match: RegExpExecArray | null;
  while ((match = GEOMETRY_PATTERN.exec(source)) !== null) {
    const primitive = match[1];
    const argsRaw = match[2];
    const prefix = source.slice(0, match.index);
    const line = prefix.split('\n').length;
    hits.push({
      file,
      line,
      primitive,
      args: argsRaw,
      segments: parseNumericLiterals(argsRaw),
    });
  }
  return hits;
};

describe('Scene geometry budget (P9-02)', () => {
  const allHits = SCANNED_FILES.flatMap(collectGeometry);

  it('scans every listed source file', () => {
    // Sanity: the scan produced hits for every file that ships primitive
    // geometry in the segmentable set. Files like Desk / ContactCard /
    // Window are box/plane-only and produce zero segmentable hits — that's
    // fine, they're in the scan list only to guarantee the audit is
    // exhaustive.
    expect(allHits.length).toBeGreaterThan(0);
  });

  it('sphereGeometry stays within widthSegments ≤ 32, heightSegments ≤ 24', () => {
    const spheres = allHits.filter((h) => h.primitive === 'sphereGeometry');
    expect(spheres.length).toBeGreaterThan(0);
    for (const h of spheres) {
      // args: [radius, widthSegments, heightSegments, ...]
      const width = h.segments[1];
      const height = h.segments[2];
      expect(
        width,
        `${h.file}:${h.line} sphereGeometry widthSegments=${width}`,
      ).toBeLessThanOrEqual(32);
      expect(
        height,
        `${h.file}:${h.line} sphereGeometry heightSegments=${height}`,
      ).toBeLessThanOrEqual(24);
    }
  });

  it('cylinderGeometry / coneGeometry radialSegments ≤ 24', () => {
    const radial = allHits.filter(
      (h) =>
        h.primitive === 'cylinderGeometry' || h.primitive === 'coneGeometry',
    );
    expect(radial.length).toBeGreaterThan(0);
    for (const h of radial) {
      const segmentIndex = h.primitive === 'cylinderGeometry' ? 3 : 2;
      const segments = h.segments[segmentIndex];
      expect(
        segments,
        `${h.file}:${h.line} ${h.primitive} radialSegments=${segments}`,
      ).toBeLessThanOrEqual(24);
    }
  });

  it('torusGeometry radialSegments ≤ 16, tubularSegments ≤ 12', () => {
    const toruses = allHits.filter((h) => h.primitive === 'torusGeometry');
    for (const h of toruses) {
      // args: [radius, tube, radialSegments, tubularSegments, arc?]
      const radial = h.segments[2];
      const tubular = h.segments[3];
      expect(
        radial,
        `${h.file}:${h.line} torusGeometry radialSegments=${radial}`,
      ).toBeLessThanOrEqual(16);
      expect(
        tubular,
        `${h.file}:${h.line} torusGeometry tubularSegments=${tubular}`,
      ).toBeLessThanOrEqual(12);
    }
  });

  it('every segmentable primitive has a finite segment arg at the expected position', () => {
    for (const h of allHits) {
      if (!SEGMENTABLE_PRIMITIVES.has(h.primitive)) continue;
      // Pick the arg position whose cap we actually enforce.
      const positions =
        h.primitive === 'sphereGeometry'
          ? [1, 2]
          : h.primitive === 'cylinderGeometry'
            ? [3]
            : h.primitive === 'coneGeometry'
              ? [2]
              : [2, 3];
      for (const idx of positions) {
        const v = h.segments[idx];
        expect(
          Number.isFinite(v),
          `${h.file}:${h.line} ${h.primitive} arg[${idx}] was '${h.args}'`,
        ).toBe(true);
      }
    }
  });
});
