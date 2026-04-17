'use client';

import type { Project } from '@/content/projects/schemas';
import { PanelFrame } from '@/ui/panels/PanelFrame';

export interface ProjectPanelProps {
  project: Project;
  onClose: () => void;
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(232, 226, 212, 0.55)',
  marginBottom: '0.25rem',
};

const sectionStyle: React.CSSProperties = {
  marginTop: '1.25rem',
};

const bodyStyle: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: 1.6,
};

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <section style={sectionStyle}>
    <div style={sectionLabel}>{label}</div>
    <div style={bodyStyle}>{children}</div>
  </section>
);

export const ProjectPanel = ({
  project,
  onClose,
}: ProjectPanelProps): React.ReactElement => {
  const titleId = `project-panel-${project.id}-title`;

  return (
    <PanelFrame
      titleId={titleId}
      ariaLabel={`${project.title} details`}
      onClose={onClose}
    >
      <div data-testid={`project-panel-${project.id}`}>
        <h2
          id={titleId}
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {project.title}
        </h2>
        <p
          style={{
            ...bodyStyle,
            marginTop: '0.5rem',
            color: 'rgba(232, 226, 212, 0.82)',
          }}
        >
          {project.summary}
        </p>

        <Section label="Role">{project.role}</Section>
        <Section label="Problem">{project.problem}</Section>
        <Section label="Approach">{project.approach}</Section>

        <Section label="Stack">
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              padding: 0,
              margin: 0,
              listStyle: 'none',
            }}
          >
            {project.stack.map((s) => (
              <li
                key={s}
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.8rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(232, 226, 212, 0.18)',
                  color: 'rgba(232, 226, 212, 0.82)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section label="Outcome">{project.outcome}</Section>

        {project.screenshots.length > 0 ? (
          <Section label="Screenshots">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.6rem',
              }}
            >
              {project.screenshots.map((s) => (
                <figure key={s.src} style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.src}
                    alt={s.alt}
                    style={{ width: '100%', borderRadius: '0.25rem' }}
                  />
                  {s.caption ? (
                    <figcaption
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(232, 226, 212, 0.55)',
                        marginTop: '0.25rem',
                      }}
                    >
                      {s.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </Section>
        ) : null}

        {project.links.length > 0 ? (
          <Section label="Links">
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {project.links.map((l) => (
                <li key={l.href} style={{ marginBottom: '0.25rem' }}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                      textUnderlineOffset: '0.2em',
                    }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    </PanelFrame>
  );
};
