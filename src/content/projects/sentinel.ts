import type { Project } from '@/content/projects/schemas';

export const sentinelProject: Project = {
  id: 'sentinel',
  title: 'Sentinel',
  summary:
    'Open-source CLI for visual regression: captures screenshots, diffs against baselines via pixel + SSIM + ML classification, and detects design drift against Figma/Sketch sources across Chromium, Firefox, and WebKit.',
  role: 'Author, maintainer.',
  problem:
    'Pixel-diff-only visual regression flags every legitimate spacing tweak as a failure; teams either lower their threshold until real bugs slip through, or stop running the gate entirely. There\'s no widely-adopted middle-ground that distinguishes "designer changed the padding" from "regression broke the layout."',
  approach:
    'Three-tier classifier: cheap pixel diff first, SSIM for structural similarity second, ML model for semantic equivalence third. Drift detection compares the rendered DOM against the source-of-truth design file. Bundle a local dashboard, ship a GitHub Action with PR comments + status checks, ship a VS Code extension for in-editor review, ship a watch mode for local dev.',
  stack: [
    'TypeScript',
    'Playwright',
    'GitHub Actions',
    'VS Code Extension API',
    'ML Classification',
  ],
  outcome:
    'Single CLI covers local dev (watch mode), CI (Action with PR comments), and review (VS Code extension). Cross-browser via Playwright. Open source under MIT.',
  screenshots: [],
  links: [
    {
      label: 'Source on GitHub',
      href: 'https://github.com/essandhu/Sentinel',
    },
  ],
  spine: {
    color: '#5a3d8a',
    material: 'cloth',
    accent: false,
  },
};
