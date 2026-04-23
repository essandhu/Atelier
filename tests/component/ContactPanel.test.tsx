import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ContactPanel } from '@/ui/panels/ContactPanel';
import { sceneStore } from '@/store/scene-store';
import type { Profile } from '@/content/profile';

// Radix Dialog renders its content inside a Portal gated on internal focus
// management that can race in happy-dom. Mock the Portal to render children
// inline so the DOM stays queryable and the Dialog renders without throwing
// on focus guard teardown. Mirror of the mock used in sibling panel tests.
vi.mock('radix-ui', async () => {
  const actual = await vi.importActual<typeof import('radix-ui')>('radix-ui');
  const PortalPassthrough = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    ...actual,
    Dialog: {
      ...actual.Dialog,
      Portal: PortalPassthrough,
    },
  };
});

const openPanel = (): void => {
  sceneStore.setState({
    phase: 'open',
    activePanel: { kind: 'contact' },
    hoveredObject: null,
    openedAt: 0,
  });
};

const baseProfile: Profile = {
  name: 'Erick Sandhu',
  role: 'Software Developer',
  positioning: 'Positioning copy.',
  location: 'Texas, United States',
  githubUsername: 'essandhu',
  contacts: {
    email: 'essandhu22@gmail.com',
    links: [
      { label: 'GitHub', href: 'https://github.com/essandhu' },
      { label: 'LinkedIn', href: 'https://linkedin.com/in/erick-sandhu' },
    ],
  },
};

const profileWithResume: Profile = {
  ...baseProfile,
  contacts: {
    ...baseProfile.contacts,
    resumeUrl: 'https://example.com/erick-sandhu-resume.pdf',
  },
};

describe('<ContactPanel>', () => {
  afterEach(() => cleanup());

  it('renders the profile name as an accessible heading', () => {
    openPanel();
    const { container } = render(
      <ContactPanel profile={baseProfile} onClose={() => {}} />,
    );
    // The visible <h2> inside [data-testid="contact-panel"] carries the
    // panel's accessible name via aria-labelledby. Scope the query to the
    // body so we don't match PanelFrame's visually-hidden DialogTitle
    // (which also renders as an h2 and contains the profile name).
    const body = container.querySelector(
      '[data-testid="contact-panel"]',
    ) as HTMLElement | null;
    expect(body).not.toBeNull();
    const heading = body!.querySelector('h2');
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toMatch(/erick sandhu/i);
  });

  it('renders the email as a mailto link with the email text', () => {
    openPanel();
    render(<ContactPanel profile={baseProfile} onClose={() => {}} />);
    const mail = screen.getByRole('link', { name: /essandhu22@gmail\.com/i });
    expect(mail).toHaveAttribute('href', 'mailto:essandhu22@gmail.com');
  });

  it('renders each external link with target=_blank and rel noopener noreferrer', () => {
    openPanel();
    render(<ContactPanel profile={baseProfile} onClose={() => {}} />);
    for (const link of baseProfile.contacts.links) {
      const a = screen.getByRole('link', { name: link.label });
      expect(a).toHaveAttribute('href', link.href);
      expect(a).toHaveAttribute('target', '_blank');
      const rel = a.getAttribute('rel') ?? '';
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  it('renders the resumeUrl as a prominent download link when present', () => {
    openPanel();
    render(<ContactPanel profile={profileWithResume} onClose={() => {}} />);
    const resume = screen.getByRole('link', { name: /resume/i });
    expect(resume).toHaveAttribute(
      'href',
      'https://example.com/erick-sandhu-resume.pdf',
    );
    expect(resume).toHaveAttribute('target', '_blank');
    const rel = resume.getAttribute('rel') ?? '';
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  it('omits the resume link when resumeUrl is absent', () => {
    openPanel();
    render(<ContactPanel profile={baseProfile} onClose={() => {}} />);
    expect(screen.queryByRole('link', { name: /resume/i })).toBeNull();
  });

  it('exposes the data-testid for playwright', () => {
    openPanel();
    const { container } = render(
      <ContactPanel profile={baseProfile} onClose={() => {}} />,
    );
    expect(
      container.querySelector('[data-testid="contact-panel"]'),
    ).not.toBeNull();
  });

  it('clicking the close button fires onClose', () => {
    openPanel();
    const onClose = vi.fn();
    render(<ContactPanel profile={baseProfile} onClose={onClose} />);
    screen.getByRole('button', { name: /close panel/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
