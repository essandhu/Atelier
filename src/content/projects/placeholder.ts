import type { Project } from '@/content/projects/schemas';

export const placeholderProject: Project = {
  id: 'atelier-placeholder',
  title: 'Atelier (placeholder)',
  summary: 'A stand-in project while the real content is curated in Phase 4.',
  role: 'Author, engineer, sole contributor.',
  problem:
    'Portfolios either read like résumés or like demos. Neither carries the feeling of craft.',
  approach:
    'Build a spatial reading room where projects sit on a desk as books; live GitHub activity breathes in from the window.',
  stack: ['Next.js', 'TypeScript', 'React Three Fiber', 'Tailwind CSS'],
  outcome:
    'Under construction. Real outcomes replace this text once Phase 4 lands.',
  screenshots: [],
  links: [],
  visibility: 'public',
  spine: {
    color: '#2b2a27',
    material: 'cloth',
    accent: false,
  },
};
