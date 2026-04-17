import { z } from 'zod';

export const SkillCategory = z.enum([
  'frontend',
  'creative3d',
  'backend',
  'tooling',
  'product',
]);
export type SkillCategory = z.infer<typeof SkillCategory>;

export const Skill = z.object({
  id: z.string(),
  label: z.string(),
  category: SkillCategory,
  years: z.number().int().nonnegative(),
  contextNote: z.string().optional(),
  relatedProjectIds: z.array(z.string()).default([]),
});
export type Skill = z.infer<typeof Skill>;
