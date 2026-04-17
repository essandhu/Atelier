export interface Profile {
  name: string;
  role: string;
  positioning: string;
  city: string;
  githubUsername: string;
  contacts: {
    email: string;
    links: Array<{ label: string; href: string }>;
    resumeUrl?: string;
  };
}

// Placeholder profile. Phase 5 owns the real content swap.
// `githubUsername` must be a real GitHub account — the Phase 1 acceptance
// test pulls the live 90-day contribution total for this user.
export const profile: Profile = {
  name: 'Atelier Placeholder',
  role: 'Creative Software Engineer',
  positioning:
    'Crafting spatial, cinematic software that reads like a printed page.',
  city: 'Earth',
  githubUsername: process.env.GITHUB_USERNAME ?? 'octocat',
  contacts: {
    email: 'hello@example.com',
    links: [
      { label: 'GitHub', href: 'https://github.com/octocat' },
    ],
  },
};
