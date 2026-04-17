import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntroOverlay } from '@/ui/intro/IntroOverlay';
import { prefsStore } from '@/store/prefs-store';
import type { Profile } from '@/content/profile';

const profile: Profile = {
  name: 'Test Person',
  role: 'Test Role',
  positioning: 'Test positioning copy.',
  location: 'Testville',
  githubUsername: 'test',
  contacts: { email: 'test@example.com', links: [] },
};

const resetPrefs = () =>
  prefsStore.setState({
    hasSeenIntro: false,
    webcamOptIn: false,
    reducedMotion: false,
  });

const stubMatchMedia = (matches = false) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches,
      media: '(max-width: 480px)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    })),
  );

describe('<IntroOverlay>', () => {
  beforeEach(() => {
    resetPrefs();
    stubMatchMedia(false);
  });

  afterEach(() => {
    cleanup();
    resetPrefs();
    vi.unstubAllGlobals();
  });

  it('renders profile name, role and positioning', () => {
    render(<IntroOverlay profile={profile} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      profile.name,
    );
    expect(screen.getByText(profile.role)).toBeTruthy();
    expect(screen.getByText(profile.positioning)).toBeTruthy();
  });

  it('Begin click calls dismissIntro', () => {
    const onDismiss = vi.fn();
    render(<IntroOverlay profile={profile} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /begin/i }));
    expect(prefsStore.getState().hasSeenIntro).toBe(true);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('omits the webcam toggle on narrow viewports', () => {
    stubMatchMedia(true);
    render(<IntroOverlay profile={profile} />);
    expect(screen.queryByTestId('webcam-toggle')).toBeNull();
  });

  it('shortens animation duration under reducedMotion', () => {
    prefsStore.setState({ reducedMotion: true });
    render(<IntroOverlay profile={profile} />);
    const overlay = screen.getByTestId('intro-overlay');
    expect(overlay.getAttribute('data-reduced-motion')).toBe('true');
  });
});
