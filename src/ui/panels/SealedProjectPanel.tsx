'use client';

import type { Project } from '@/content/projects/schemas';
import { PanelFrame } from '@/ui/panels/PanelFrame';

export interface SealedProjectPanelProps {
  project: Project;
  onClose: () => void;
}

const SEALED_COPY =
  "This project is under NDA. The deep problem statement, approach, screenshots, and outcome metrics can't be shown publicly. Below is what I can disclose.";

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(232, 226, 212, 0.45)',
  marginBottom: '0.25rem',
};

export const SealedProjectPanel = ({
  project,
  onClose,
}: SealedProjectPanelProps): React.ReactElement => {
  const titleId = `sealed-project-panel-${project.id}-title`;

  return (
    <PanelFrame
      titleId={titleId}
      ariaLabel={`${project.title} — sealed project details`}
      onClose={onClose}
      muted
    >
      <div data-testid={`sealed-project-panel-${project.id}`}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <h2
            id={titleId}
            style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              margin: 0,
              color: 'rgba(232, 226, 212, 0.82)',
            }}
          >
            {project.title}
          </h2>
          <span
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'rgba(232, 226, 212, 0.5)',
              border: '1px solid rgba(232, 226, 212, 0.3)',
              padding: '0.1rem 0.5rem',
              borderRadius: '999px',
            }}
          >
            sealed
          </span>
        </div>

        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginTop: '1rem',
            color: 'rgba(232, 226, 212, 0.7)',
            fontStyle: 'italic',
          }}
        >
          {SEALED_COPY}
        </p>

        <section style={{ marginTop: '1.25rem' }}>
          <div style={sectionLabel}>Role</div>
          <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>
            {project.role}
          </div>
        </section>

        <section style={{ marginTop: '1.25rem' }}>
          <div style={sectionLabel}>Stack</div>
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
                  border: '1px solid rgba(232, 226, 212, 0.15)',
                  color: 'rgba(232, 226, 212, 0.7)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        </section>

        {project.links.length > 0 ? (
          <section style={{ marginTop: '1.25rem' }}>
            <div style={sectionLabel}>Links</div>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {project.links.map((l) => (
                <li key={l.href} style={{ marginBottom: '0.25rem' }}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'rgba(232, 226, 212, 0.82)',
                      textDecoration: 'underline',
                      textUnderlineOffset: '0.2em',
                    }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PanelFrame>
  );
};
