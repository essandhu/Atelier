import type { ExperienceEntry } from '@/content/experience/schemas';
import { atelierExperience } from './atelier';
import { paycomExperience } from './paycom';

// Ordered most-recent-start-date first.
const experience: ExperienceEntry[] = [atelierExperience, paycomExperience];

export default experience;
