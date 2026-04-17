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

export const profile: Profile = {
  name: 'Erick Sandhu',
  role: 'Software Developer',
  positioning:
    'Building component libraries, design systems, and full-stack apps that ship. Currently pursuing an M.S. in Computer Science at UT Austin while contributing to open-source developer tooling.',
  city: 'Irving, TX',
  // Phase 1 acceptance test pulls live 90-day contributions for this account.
  githubUsername: process.env.GITHUB_USERNAME ?? 'essandhu',
  contacts: {
    email: 'essandhu22@gmail.com',
    links: [
      { label: 'GitHub', href: 'https://github.com/essandhu' },
      { label: 'LinkedIn', href: 'https://linkedin.com/in/erick-sandhu' },
      { label: 'Website', href: 'https://ericksandhu.dev' },
    ],
  },
};
