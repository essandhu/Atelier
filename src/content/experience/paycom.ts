import type { ExperienceEntry } from '@/content/experience/schemas';

export const paycomExperience: ExperienceEntry = {
  id: 'paycom',
  company: 'Paycom',
  title: 'Software Developer',
  start: '2024-11',
  end: '2026-03',
  summary:
    'Triaged bugs, maintenance work, and feature requests across a 100+ component internal UI library; built full-stack data-management modules behind weekly release trains; provided architecture guidance to product teams on SPA setup, front-end patterns, and cross-browser support.',
  highlights: [
    'Migrated a 100+ component UI library off Material UI v4 — reduced bundle size ~40 % and removed the JSS runtime dependency across dozens of product teams.',
    'Architected a three-tier design token system (brand → semantic → component) via theme providers, cutting component development time ~25 % and unifying consistency across multiple codebases.',
    'Built full-stack modules in PHP, C#, and MVC with REST API controllers and database bundles; deployed via Docker on weekly release cycles in lockstep with design, product, and QA.',
  ],
};
