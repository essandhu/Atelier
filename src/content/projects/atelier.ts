import type { Project } from '@/content/projects/schemas';

export const atelierProject: Project = {
  id: 'atelier',
  title: 'Atelier',
  summary:
    'A spatial, cinematic developer portfolio rendered in real-time WebGL — a reading room where projects sit on a desk as books and live GitHub activity breathes in from the window. The site you are looking at right now.',
  role: 'Author, engineer, designer. Sole contributor.',
  problem:
    'Portfolios default to résumé-grid or demo-reel. Neither conveys the feeling of craft, nor does either reveal how a developer actually spends their hours. Recruiters and collaborators leave with a checklist, not a sense of taste.',
  approach:
    'Treat the portfolio as an environment, not a document. Build a single evening-lit interior in React Three Fiber: a desk, a lamp, a window, and books — one tracking live commit activity via a 3D-extruded contribution grid, the rest opening into each case study. A shadcn-styled panel rises over the open pages; Escape, click-outside, and focus restoration close it. Every phase is gated by measured performance budgets (≤1 MB per route, 60 fps on mid laptops, Lighthouse ≥ 80 on the pessimistic night state).',
  stack: [
    'Next.js 15',
    'React 19',
    'TypeScript',
    'React Three Fiber',
    'Three.js',
    'Zustand',
    'Tailwind CSS v4',
    'shadcn/ui',
    'Radix Primitives',
    'Framer Motion',
    'Zod',
    'Vitest',
    'Playwright',
  ],
  outcome:
    'Five phases shipped: foundation, evening scene, live GitHub activity with error/loading branches, an interactive project book that opens into a focus-trapped panel with telemetry, and the multi-state lighting + no-JS fallback + perf-gate closeout. Route bundle stays under the 1 MB budget across every phase.',
  screenshots: [],
  links: [
    {
      label: 'Source on GitHub',
      href: 'https://github.com/essandhu/atelier',
    },
  ],
  spine: {
    color: '#8a3e1f',
    material: 'leather',
    accent: true,
  },
};
