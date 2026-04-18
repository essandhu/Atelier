import type { Skill, SkillCategory } from '@/content/skills/schemas';

// Canonical reading order — matches the SkillCategory zod enum in schemas.ts
// and the fallback page's `skillOrder` array. Keeping one source here means
// the /fallback page and the SkillsCatalogPanel can converge on the same
// helper.
const CATEGORY_ORDER: readonly SkillCategory[] = [
  'frontend',
  'creative3d',
  'backend',
  'tooling',
  'product',
] as const;

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  frontend: 'Frontend',
  creative3d: '3D / Creative',
  backend: 'Backend',
  tooling: 'Tooling',
  product: 'Product',
};

export interface SkillGroup {
  category: SkillCategory;
  label: string;
  skills: Skill[];
}

export const categoryLabel = (category: SkillCategory): string =>
  CATEGORY_LABELS[category];

export const linkedProjectSlugs = (skill: Skill): string[] =>
  skill.relatedProjectIds;

const bySkillOrder = (a: Skill, b: Skill): number => {
  if (a.years !== b.years) return b.years - a.years;
  return a.label.localeCompare(b.label);
};

export const groupSkills = (skills: Skill[]): SkillGroup[] => {
  const buckets = new Map<SkillCategory, Skill[]>();
  for (const skill of skills) {
    const bucket = buckets.get(skill.category) ?? [];
    bucket.push(skill);
    buckets.set(skill.category, bucket);
  }

  const groups: SkillGroup[] = [];
  for (const category of CATEGORY_ORDER) {
    const bucket = buckets.get(category);
    if (!bucket || bucket.length === 0) continue;
    const sorted = [...bucket].sort(bySkillOrder);
    groups.push({
      category,
      label: CATEGORY_LABELS[category],
      skills: sorted,
    });
  }
  return groups;
};
