import type { TimeOfDayState } from './types';

const VALID_STATES: readonly TimeOfDayState[] = [
  'morning',
  'day',
  'evening',
  'night',
] as const;

const isState = (value: string | null): value is TimeOfDayState =>
  value !== null && (VALID_STATES as readonly string[]).includes(value);

const hourToState = (hour: number): TimeOfDayState => {
  if (hour >= 5 && hour <= 9) return 'morning';
  if (hour >= 10 && hour <= 15) return 'day';
  if (hour >= 16 && hour <= 19) return 'evening';
  return 'night';
};

export interface ResolveInput {
  url?: URL;
  now?: Date;
}

export const resolve = (input: ResolveInput = {}): TimeOfDayState => {
  const override = input.url?.searchParams.get('time') ?? null;
  if (override !== null) {
    if (isState(override)) return override;
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[time-of-day] Ignoring invalid ?time value: ${JSON.stringify(override)}`,
      );
    }
  }

  const now = input.now ?? new Date();
  return hourToState(now.getHours());
};
