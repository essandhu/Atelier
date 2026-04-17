import type { ExperienceEntry } from '@/content/experience/schemas';

export const atelierExperience: ExperienceEntry = {
  id: 'atelier-self',
  company: 'Independent',
  title: 'Creative Software Engineer',
  start: '2025-12',
  end: null,
  summary:
    'Designing and shipping Atelier — a spatial, cinematic developer portfolio — as a sole-contributor production project gated by measurable performance and accessibility budgets at every phase.',
  highlights: [
    'Architected a Next.js 15 + React Three Fiber runtime that holds ≥ 55 fps on mid-tier laptops while streaming live GitHub activity through a schema-validated pipeline.',
    'Introduced phase-by-phase acceptance gates: typecheck, lint, unit + component suite, Playwright end-to-end, bundle-size guard, and asset-budget verifier — each wired as a PR-blocking CI step.',
    'Built the full accessibility story — skip-to-fallback link, focus-trapped Radix Dialog panels, reduced-motion fallbacks, semantic /fallback route — before visual polish.',
  ],
};
