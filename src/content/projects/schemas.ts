import { z } from 'zod';

export const Project = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  role: z.string(),
  problem: z.string(),
  approach: z.string(),
  stack: z.array(z.string()),
  outcome: z.string(),
  screenshots: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string(),
        caption: z.string().optional(),
      }),
    )
    .default([]),
  links: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().url(),
      }),
    )
    .default([]),
  spine: z.object({
    color: z.string(),
    material: z.enum(['cloth', 'leather', 'paper', 'wax']),
    accent: z.boolean().default(false),
  }),
});
export type Project = z.infer<typeof Project>;
