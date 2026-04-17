import { atelierProject } from '@/content/projects/atelier';
import { sealedFintechProject } from '@/content/projects/sealed-fintech';

export const fixtures = {
  public: atelierProject,
  nda: sealedFintechProject,
} as const;
