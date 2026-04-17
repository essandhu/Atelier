import { describe, expect, it } from 'vitest';
import {
  loadExperience,
  loadProfile,
  loadProjects,
  loadSkills,
} from '@/data/loaders/projects';

describe('content schemas', () => {
  it('loads the profile', () => {
    const profile = loadProfile();
    expect(profile.githubUsername.length).toBeGreaterThan(0);
    expect(profile.name.length).toBeGreaterThan(0);
  });

  it('parses every project', () => {
    const projects = loadProjects();
    expect(projects.length).toBeGreaterThanOrEqual(1);
    for (const project of projects) {
      expect(project.id).toBeTruthy();
      expect(['public', 'nda']).toContain(project.visibility);
      expect(['cloth', 'leather', 'paper', 'wax']).toContain(
        project.spine.material,
      );
    }
  });

  it('parses every skill', () => {
    const skills = loadSkills();
    expect(skills.length).toBeGreaterThanOrEqual(1);
    for (const skill of skills) {
      expect(skill.years).toBeGreaterThanOrEqual(0);
      expect(['frontend', 'creative3d', 'backend', 'tooling', 'product']).toContain(
        skill.category,
      );
    }
  });

  it('parses the experience list (empty in P1 is OK)', () => {
    const entries = loadExperience();
    expect(Array.isArray(entries)).toBe(true);
  });
});
