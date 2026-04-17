import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import * as THREE from 'three';
import {
  StartupSequence,
  startupDurationFor,
} from '@/ui/intro/StartupSequence';
import { prefsStore } from '@/store/prefs-store';

const resetPrefs = () =>
  prefsStore.setState({ reducedMotion: false });

const Harness = () => {
  const ref = useRef<THREE.Mesh>(null);
  // Create a mesh-like object that holds an emissiveIntensity
  return <StartupSequence lampBulbRef={ref} />;
};

describe('startupDurationFor', () => {
  afterEach(() => {
    resetPrefs();
  });

  it('night gets the longest ramp', () => {
    expect(startupDurationFor('night')).toBe(1500);
  });
  it('evening gets a medium ramp', () => {
    expect(startupDurationFor('evening')).toBe(1200);
  });
  it('day gets a short ramp', () => {
    expect(startupDurationFor('day')).toBe(400);
  });
  it('morning sits between day and evening', () => {
    expect(startupDurationFor('morning')).toBe(600);
  });
});

describe('<StartupSequence>', () => {
  beforeEach(() => {
    resetPrefs();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '',
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

  it('returns null under reduced motion', () => {
    prefsStore.setState({ reducedMotion: true });
    const { container } = render(<Harness />);
    // Component renders a single aria-hidden marker when active;
    // under reduced motion it should render nothing visible.
    expect(container.querySelector('[data-testid="startup-sequence"]')).toBeNull();
  });

  it('renders a marker when reduced motion is off', () => {
    const { container } = render(<Harness />);
    expect(
      container.querySelector('[data-testid="startup-sequence"]'),
    ).not.toBeNull();
  });
});
