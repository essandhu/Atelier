import { atelierProject } from '@/content/projects/atelier';
import { sealedFintechProject } from '@/content/projects/sealed-fintech';
import { placeholderProject } from '@/content/projects/placeholder';
import type { Project } from '@/content/projects/schemas';

const projects: Project[] = [
  atelierProject,
  sealedFintechProject,
  placeholderProject,
];

export default projects;
