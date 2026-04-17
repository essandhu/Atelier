import type { Project } from '@/content/projects/schemas';

export const atelierProject: Project = {
  id: 'atelier',
  title: 'Atelier',
  summary:
    'A spatial, cinematic developer portfolio rendered in real-time WebGL — a reading room where projects sit on a desk as books and live GitHub activity breathes in from the window.',
  role: 'Author, engineer, designer. Sole contributor.',
  problem:
    'Portfolios default to résumé-grid or demo-reel. Neither conveys the feeling of craft, nor does either reveal how a developer actually spends their hours. Recruiters and collaborators leave with a checklist, not a sense of taste.',
  approach:
    'Treat the portfolio as an environment, not a document. Build a single evening-lit interior in React Three Fiber: a desk, a lamp, a window, and two books — one that tracks live commit activity via a 3D-extruded contribution grid, and one that opens into each case study. A shadcn-styled panel rises over the open pages; Escape, click-outside, and focus restoration close it. Every phase is gated by measured performance budgets (≤1 MB per route, 60 fps on mid laptops).',
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
    'Four phases shipped to date: static evening scene (60 fps on Intel Iris Xe), live GitHub activity with error + loading fallbacks, and a fully interactive project book that opens into an accessible, focus-trapped panel with telemetry. Route bundle stays under the 1 MB budget across every phase.',
  screenshots: [],
  links: [
    {
      label: 'Source on GitHub',
      href: 'https://github.com/ericksandhu/atelier',
    },
  ],
  visibility: 'public',
  spine: {
    color: '#8a3e1f',
    material: 'leather',
    accent: true,
  },
};
