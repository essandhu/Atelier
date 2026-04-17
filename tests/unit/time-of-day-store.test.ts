import { beforeEach, describe, expect, it } from 'vitest';
import { timeOfDayStore } from '@/store/time-of-day-store';

describe('time-of-day-store', () => {
  beforeEach(() => {
    timeOfDayStore.setState({ resolved: null });
  });

  it('starts with resolved === null', () => {
    expect(timeOfDayStore.getState().resolved).toBeNull();
  });

  it('initialize() sets the resolved state once', () => {
    timeOfDayStore.getState().initialize('evening');
    expect(timeOfDayStore.getState().resolved).toBe('evening');
  });

  it('initialize() throws when called a second time', () => {
    timeOfDayStore.getState().initialize('evening');
    expect(() => timeOfDayStore.getState().initialize('night')).toThrow(
      /already initialized/i,
    );
  });

  it('ensureInitialized() defaults to evening when unresolved', () => {
    timeOfDayStore.getState().ensureInitialized();
    expect(timeOfDayStore.getState().resolved).toBe('evening');
  });

  it('ensureInitialized() is idempotent — second call does not throw', () => {
    timeOfDayStore.getState().ensureInitialized();
    expect(() => timeOfDayStore.getState().ensureInitialized()).not.toThrow();
    expect(timeOfDayStore.getState().resolved).toBe('evening');
  });

  it('ensureInitialized(state) binds to the supplied state', () => {
    timeOfDayStore.getState().ensureInitialized('morning');
    expect(timeOfDayStore.getState().resolved).toBe('morning');
  });

  it('ensureInitialized(state) is a no-op after resolution', () => {
    timeOfDayStore.getState().ensureInitialized('morning');
    timeOfDayStore.getState().ensureInitialized('day');
    expect(timeOfDayStore.getState().resolved).toBe('morning');
  });
});
