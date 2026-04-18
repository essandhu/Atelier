'use client';

import { useMemo } from 'react';
import { loadProjects, loadSkills } from '@/data/loaders/projects';
import { groupSkills } from '@/content/skills/grouping';
import { durations } from '@/ui/motion/tokens';
import { sceneStore } from '@/store/scene-store';
import { PanelFrame } from '@/ui/panels/PanelFrame';
import type { Skill } from '@/content/skills/schemas';
import type { Project } from '@/content/projects/schemas';

export interface SkillsCatalogPanelProps {
  onClose: () => void;
}

const TITLE_ID = 'skills-panel-title';

const headingStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '-0.01em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  marginTop: '0.35rem',
  color: 'rgba(232, 226, 212, 0.55)',
};

const sectionStyle: React.CSSProperties = {
  marginTop: '1.5rem',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(232, 226, 212, 0.55)',
  marginBottom: '0.5rem',
};

const skillListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem',
};

const skillRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  paddingTop: '0.35rem',
  borderTop: '1px solid rgba(232, 226, 212, 0.08)',
};

const skillLabelStyle: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: 1.4,
};

const skillYearsStyle: React.CSSProperties = {
  color: 'rgba(232, 226, 212, 0.55)',
  marginLeft: '0.35rem',
  fontSize: '0.85rem',
};

const contextNoteStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'rgba(232, 226, 212, 0.55)',
  lineHeight: 1.45,
};

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  marginTop: '0.35rem',
};

const chipStyle: React.CSSProperties = {
  padding: '0.2rem 0.6rem',
  fontSize: '0.75rem',
  borderRadius: '999px',
  border: '1px solid rgba(232, 226, 212, 0.18)',
  background: 'transparent',
  color: 'var(--accent)',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
};

const SkillRow = ({
  skill,
  projects,
}: {
  skill: Skill;
  projects: Project[];
}): React.ReactElement => {
  const linked = skill.relatedProjectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));

  const openProject = (slug: string): void => {
    sceneStore.getState().close();
    window.setTimeout(() => {
      sceneStore.getState().open({ kind: 'project', id: slug });
    }, durations.panel);
  };

  return (
    <li style={skillRowStyle}>
      <div>
        <span style={skillLabelStyle}>{skill.label}</span>
        <span style={skillYearsStyle}>· {skill.years} yrs</span>
      </div>
      {skill.contextNote ? (
        <p style={contextNoteStyle}>{skill.contextNote}</p>
      ) : null}
      {linked.length > 0 ? (
        <div style={chipRowStyle}>
          {linked.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => openProject(project.id)}
              aria-label={`Open ${project.title} details`}
              style={chipStyle}
            >
              {project.title}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
};

export const SkillsCatalogPanel = ({
  onClose,
}: SkillsCatalogPanelProps): React.ReactElement => {
  const projects = useMemo(() => loadProjects(), []);
  const groups = useMemo(() => groupSkills(loadSkills()), []);

  return (
    <PanelFrame
      titleId={TITLE_ID}
      ariaLabel="Skills catalog"
      onClose={onClose}
    >
      <div data-testid="skills-catalog-panel">
        <h2 id={TITLE_ID} style={headingStyle}>
          Skills &amp; Technologies
        </h2>
        <p style={subtitleStyle}>
          Grouped by domain. Click a related project to open it.
        </p>

        {groups.map((group) => (
          <section key={group.category} style={sectionStyle}>
            <h3 style={sectionLabelStyle}>{group.label}</h3>
            <ul style={skillListStyle}>
              {group.skills.map((skill) => (
                <SkillRow key={skill.id} skill={skill} projects={projects} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PanelFrame>
  );
};
