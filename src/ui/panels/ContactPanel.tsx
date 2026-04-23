'use client';

import type { Profile } from '@/content/profile';
import { PanelFrame } from '@/ui/panels/PanelFrame';

export interface ContactPanelProps {
  profile: Profile;
  onClose: () => void;
}

const TITLE_ID = 'contact-panel-title';

const kickerStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(232, 226, 212, 0.55)',
  margin: 0,
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(232, 226, 212, 0.55)',
  marginBottom: '0.35rem',
};

const sectionStyle: React.CSSProperties = {
  marginTop: '1.5rem',
};

const bodyStyle: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: 1.65,
};

const bodyColumn: React.CSSProperties = {
  maxWidth: '56ch',
};

// Quiet, ink-coloured external links; one per row, no row rules.
const quietLinkStyle: React.CSSProperties = {
  color: 'var(--color-ink)',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(232, 226, 212, 0.28)',
  textUnderlineOffset: '0.25em',
};

// Accent-rule underline on the email — the "prominent" inline call to action.
const emailLinkStyle: React.CSSProperties = {
  color: 'var(--color-ink)',
  textDecoration: 'underline',
  textDecorationColor: 'var(--accent)',
  textDecorationThickness: '2px',
  textUnderlineOffset: '0.25em',
  fontSize: '1.15rem',
  fontFamily: 'var(--font-mono)',
};

// Filled button for the resume download — bottom-right anchor.
const resumeButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 1.1rem',
  borderRadius: '0.25rem',
  backgroundColor: 'var(--accent)',
  color: 'var(--color-bg, #0f0c0a)',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
};

export const ContactPanel = ({
  profile,
  onClose,
}: ContactPanelProps): React.ReactElement => {
  const { contacts } = profile;

  return (
    <PanelFrame
      titleId={TITLE_ID}
      ariaLabel={`Contact ${profile.name}`}
      onClose={onClose}
    >
      <div data-testid="contact-panel" style={bodyColumn}>
        <p style={kickerStyle}>Get in touch</p>
        <h2
          id={TITLE_ID}
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            margin: '0.35rem 0 0 0',
            letterSpacing: '-0.01em',
          }}
        >
          {profile.name}
        </h2>
        <p
          style={{
            ...bodyStyle,
            marginTop: '0.25rem',
            color: 'rgba(232, 226, 212, 0.7)',
          }}
        >
          {profile.role}
        </p>

        <section style={sectionStyle}>
          <div style={sectionLabel}>Email</div>
          <a href={`mailto:${contacts.email}`} style={emailLinkStyle}>
            {contacts.email}
          </a>
        </section>

        {contacts.links.length > 0 ? (
          <section style={sectionStyle}>
            <div style={sectionLabel}>Elsewhere</div>
            <ul
              style={{
                padding: 0,
                margin: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {contacts.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={quietLinkStyle}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {contacts.resumeUrl ? (
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <a
              href={contacts.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={resumeButtonStyle}
            >
              Download resume
            </a>
          </div>
        ) : null}
      </div>
    </PanelFrame>
  );
};
