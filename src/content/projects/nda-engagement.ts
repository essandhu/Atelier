import type { Project } from '@/content/projects/schemas';

// NDA-sanitized entry. The SealedProjectPanel never renders problem,
// approach, outcome, summary, or screenshots; the Zod schema still requires
// non-empty strings for those fields, so they are filled with honest
// boilerplate that stays behind the seal.
export const ndaEngagementProject: Project = {
  id: 'nda-engagement',
  title: 'Sealed engagement',
  summary:
    'Private engagement. Summary cannot be disclosed — the SealedProjectPanel renders the sealed treatment instead.',
  role: 'Frontend engineer.',
  problem:
    'Details covered under NDA. Non-disclosable per the engagement terms.',
  approach:
    'Details covered under NDA. Non-disclosable per the engagement terms.',
  stack: ['TypeScript', 'React', 'Node.js'],
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
