import projectsSource from '@/content/projects';
import { Project } from '@/content/projects/schemas';
import skillsSource from '@/content/skills';
import { Skill } from '@/content/skills/schemas';
import experienceSource from '@/content/experience';
import { ExperienceEntry } from '@/content/experience/schemas';
import { profile, type Profile } from '@/content/profile';

export const loadProfile = (): Profile => profile;

export const loadProjects = (): Project[] =>
  projectsSource.map((project) => Project.parse(project));

export const loadSkills = (): Skill[] =>
  skillsSource.map((skill) => Skill.parse(skill));

export const loadExperience = (): ExperienceEntry[] =>
  experienceSource.map((entry) => ExperienceEntry.parse(entry));
