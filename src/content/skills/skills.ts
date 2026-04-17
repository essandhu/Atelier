import type { Skill } from '@/content/skills/schemas';

// Years are an approximation across professional + academic + open-source use,
// not exact tenure at any one company. Curated to a focused list rather than a
// dump — the fallback page groups by category.
export const skills: Skill[] = [
  // Frontend
  {
    id: 'typescript',
    label: 'TypeScript',
    category: 'frontend',
    years: 5,
    contextNote: 'Primary language across product code, libraries, and tooling.',
    relatedProjectIds: ['atelier', 'sentinel', 'aurora-ui'],
  },
  {
    id: 'react',
    label: 'React',
    category: 'frontend',
    years: 5,
    relatedProjectIds: ['atelier', 'aurora-ui', 'synapse-oms'],
  },
  {
    id: 'nextjs',
    label: 'Next.js',
    category: 'frontend',
    years: 4,
    relatedProjectIds: ['atelier'],
  },
  {
    id: 'tailwind',
    label: 'Tailwind CSS',
    category: 'frontend',
    years: 5,
    relatedProjectIds: ['atelier'],
  },
  {
    id: 'radix-primitives',
    label: 'Radix Primitives',
    category: 'frontend',
    years: 4,
    contextNote: 'Accessible headless primitives backing Aurora UI + Atelier panels.',
    relatedProjectIds: ['atelier', 'aurora-ui'],
  },

  // Backend
  {
    id: 'nodejs',
    label: 'Node.js',
    category: 'backend',
    years: 4,
    relatedProjectIds: ['atelier'],
  },
  {
    id: 'python',
    label: 'Python',
    category: 'backend',
    years: 4,
    relatedProjectIds: ['synapse-oms'],
  },
  {
    id: 'go',
    label: 'Go',
    category: 'backend',
    years: 3,
    relatedProjectIds: ['synapse-oms'],
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    category: 'backend',
    years: 4,
    relatedProjectIds: ['synapse-oms'],
  },
  {
    id: 'kafka',
    label: 'Kafka',
    category: 'backend',
    years: 3,
    contextNote: 'Inter-service bus in SynapseOMS — gateway → risk engine → scorer.',
    relatedProjectIds: ['synapse-oms'],
  },

  // Tooling
  {
    id: 'git',
    label: 'Git',
    category: 'tooling',
    years: 5,
    relatedProjectIds: [],
  },
  {
    id: 'docker',
    label: 'Docker',
    category: 'tooling',
    years: 4,
    relatedProjectIds: ['synapse-oms'],
  },
  {
    id: 'vitest',
    label: 'Vitest',
    category: 'tooling',
    years: 4,
    relatedProjectIds: ['atelier', 'aurora-ui'],
  },
  {
    id: 'playwright',
    label: 'Playwright',
    category: 'tooling',
    years: 4,
    relatedProjectIds: ['atelier', 'sentinel'],
  },
  {
    id: 'github-actions',
    label: 'GitHub Actions',
    category: 'tooling',
    years: 4,
    relatedProjectIds: ['atelier', 'sentinel'],
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    category: 'tooling',
    years: 1,
    contextNote: 'AI-assisted development across this repo and SynapseOMS post-trade analysis.',
    relatedProjectIds: ['atelier', 'synapse-oms'],
  },
];
