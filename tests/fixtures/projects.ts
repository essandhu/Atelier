import { atelierProject } from '@/content/projects/atelier';
import { ndaEngagementProject } from '@/content/projects/nda-engagement';

export const fixtures = {
  public: atelierProject,
  nda: ndaEngagementProject,
} as const;
