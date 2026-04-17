import type { Project } from '@/content/projects/schemas';

// NDA-sanitized placeholder. The SealedProjectPanel never renders problem,
// approach, outcome, summary, or screenshots; the Zod schema still requires
// non-empty strings for those fields, so they are filled with honest
// boilerplate that stays behind the seal.
export const sealedFintechProject: Project = {
  id: 'sealed-fintech',
  title: 'Ledger (sealed)',
  summary:
    'Private engagement. Summary cannot be disclosed — the SealedProjectPanel renders the sealed treatment instead.',
  role: 'Lead frontend engineer on a three-person team.',
  problem:
    'Details covered under NDA. Non-disclosable per the engagement terms.',
  approach:
    'Details covered under NDA. Non-disclosable per the engagement terms.',
  stack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
  outcome:
    'Details covered under NDA. Non-disclosable per the engagement terms.',
  screenshots: [],
  links: [],
  visibility: 'nda',
  spine: {
    color: '#2a2a2e',
    material: 'wax',
    accent: false,
  },
};
