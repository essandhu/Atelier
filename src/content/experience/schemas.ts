import { z } from 'zod';

export const ExperienceEntry = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  summary: z.string(),
  highlights: z.array(z.string()),
});
export type ExperienceEntry = z.infer<typeof ExperienceEntry>;
