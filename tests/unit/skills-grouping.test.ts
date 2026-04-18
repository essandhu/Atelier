import { describe, expect, it } from 'vitest';
import type { Skill, SkillCategory } from '@/content/skills/schemas';
import {
  categoryLabel,
  groupSkills,
  linkedProjectSlugs,
} from '@/content/skills/grouping';

const make = (
  id: string,
  category: SkillCategory,
  years: number,
  relatedProjectIds: string[] = [],
): Skill => ({
  id,
  label: id,
  category,
  years,
  relatedProjectIds,
});

describe('groupSkills', () => {
  it('groups by category in the canonical reading order', () => {
    const skills: Skill[] = [
      make('a', 'tooling', 3),
      make('b', 'frontend', 2),
      make('c', 'backend', 1),
    ];
    const result = groupSkills(skills);
    const order = result.map((g) => g.category);
    expect(order).toEqual(['frontend', 'backend', 'tooling']);
  });

  it('omits empty categories', () => {
    const skills: Skill[] = [make('only', 'frontend', 1)];
    const result = groupSkills(skills);
    expect(result.map((g) => g.category)).toEqual(['frontend']);
  });

  it('orders skills within a group by years descending, then label ascending', () => {
    const skills: Skill[] = [
      { ...make('alpha', 'frontend', 3), label: 'Alpha' },
      { ...make('bravo', 'frontend', 5), label: 'Bravo' },
      { ...make('charlie', 'frontend', 3), label: 'Charlie' },
    ];
    const group = groupSkills(skills)[0];
    expect(group.skills.map((s) => s.label)).toEqual([
      'Bravo',
      'Alpha',
      'Charlie',
    ]);
  });

  it('returns a group shape with category + human label + skills', () => {
    const skills: Skill[] = [make('a', 'frontend', 1)];
    const [group] = groupSkills(skills);
    expect(group.category).toBe('frontend');
    expect(group.label).toBe('Frontend');
    expect(group.skills).toHaveLength(1);
  });
});

describe('categoryLabel', () => {
  it('maps every SkillCategory to a human label', () => {
    const all: SkillCategory[] = [
      'frontend',
      'creative3d',
      'backend',
      'tooling',
      'product',
    ];
    const labels = all.map(categoryLabel);
    expect(labels).toEqual([
      'Frontend',
      '3D / Creative',
      'Backend',
      'Tooling',
      'Product',
    ]);
  });
});

describe('linkedProjectSlugs', () => {
  it('returns the skill\'s relatedProjectIds', () => {
    const s = make('x', 'frontend', 1, ['atelier', 'sentinel']);
    expect(linkedProjectSlugs(s)).toEqual(['atelier', 'sentinel']);
  });

  it('returns an empty array when the skill has no relations', () => {
    const s = make('lonely', 'frontend', 1, []);
    expect(linkedProjectSlugs(s)).toEqual([]);
  });
});
