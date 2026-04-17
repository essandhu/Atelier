import type { Project } from '@/content/projects/schemas';

export const auroraUiProject: Project = {
  id: 'aurora-ui',
  title: 'Aurora UI',
  summary:
    'Open-source React component library — 40 accessible components published as tree-shakeable npm packages, built on Radix Primitives with a three-tier design token API and theme switching via a single DOM attribute.',
  role: 'Author, maintainer.',
  problem:
    'Most React component libraries either ship a single hardcoded design (and force you to fight the styles) or hand you primitives without a token system (and force you to invent one). Teams end up rebuilding the same theme layer over and over — primitive colour scale, semantic role mapping, component-scoped overrides — for every product they touch.',
  approach:
    'Three-tier token API surfaces all three levels — primitive (raw OKLCH ramps), semantic (role mappings like `--surface-elevated`), and component-scoped (`--button-bg`) — so theming is an opt-in choice at whichever depth the consumer needs. Theme switching is a single `data-theme` attribute on the root. Radix Primitives handle ARIA and focus management. Published as dual ESM/CJS with vitest-axe in CI.',
  stack: [
    'React',
    'TypeScript',
    'Radix Primitives',
    'Vite',
    'Vitest',
    'vitest-axe',
  ],
  outcome:
    '40 components shipped under MIT. Tree-shakeable per-package imports. WCAG-compliant via Radix + axe in the test suite. Theme system tested across light/dark/high-contrast.',
  screenshots: [],
  links: [
    {
      label: 'Source on GitHub',
      href: 'https://github.com/essandhu/aurora-ui',
    },
  ],
  spine: {
    color: '#2a6a5e',
    material: 'leather',
    accent: false,
  },
};
