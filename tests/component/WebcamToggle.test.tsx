import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WebcamToggle } from '@/ui/controls/WebcamToggle';
import { prefsStore } from '@/store/prefs-store';

const resetPrefs = () =>
  prefsStore.setState({ webcamOptIn: false, hasSeenIntro: false });

describe('<WebcamToggle>', () => {
  beforeEach(() => {
    resetPrefs();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(max-width: 480px)',
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
      })),
    );
  });

  afterEach(() => {
    cleanup();
    resetPrefs();
    vi.unstubAllGlobals();
  });

  it('renders the default "enable" label when webcamOptIn is false', () => {
    render(<WebcamToggle />);
    expect(screen.getByRole('button').textContent).toMatch(/enable/i);
  });

  it('clicking flips webcamOptIn in the store', () => {
    render(<WebcamToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(prefsStore.getState().webcamOptIn).toBe(true);
  });

  it('aria-pressed reflects the current state', () => {
    render(<WebcamToggle />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('switches label and style when enabled', () => {
    prefsStore.setState({ webcamOptIn: true });
    render(<WebcamToggle />);
    expect(screen.getByRole('button').textContent).toMatch(/disable/i);
  });
});
