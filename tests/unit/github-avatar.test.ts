import { describe, expect, it } from 'vitest';
import {
  avatarUrlFor,
  validateResponse,
} from '../../scripts/fetch-github-avatar.mjs';

describe('avatarUrlFor', () => {
  it('returns the size=460 URL for a normal username', () => {
    expect(avatarUrlFor('essandhu')).toBe(
      'https://github.com/essandhu.png?size=460',
    );
  });

  it('URL-encodes usernames with punctuation (defensive — GitHub names are alnum+hyphen, but encode anyway)', () => {
    expect(avatarUrlFor('a.b/c')).toBe(
      'https://github.com/a.b%2Fc.png?size=460',
    );
  });

  it('throws an explanatory error on an empty username', () => {
    expect(() => avatarUrlFor('')).toThrow(/username/i);
  });

  it('throws on a blank/whitespace username', () => {
    expect(() => avatarUrlFor('   ')).toThrow(/username/i);
  });

  it('throws when given a non-string', () => {
    // `.mjs` source is untyped from TS's view so no cast needed; the
    // assertion still exercises the runtime `typeof !== 'string'` guard.
    expect(() => avatarUrlFor(undefined)).toThrow(/username/i);
  });
});

describe('validateResponse', () => {
  it('returns the response on a 200', () => {
    const res = new Response('ok', { status: 200 });
    expect(validateResponse(res)).toBe(res);
  });

  it('returns the response on a 2xx non-200 (e.g., 204)', () => {
    const res = new Response(null, { status: 204 });
    expect(validateResponse(res)).toBe(res);
  });

  it('throws with status + URL on a 404', () => {
    const res = new Response('missing', {
      status: 404,
      statusText: 'Not Found',
    });
    Object.defineProperty(res, 'url', {
      value: 'https://github.com/nobody.png?size=460',
    });
    expect(() => validateResponse(res)).toThrow(/404/);
  });

  it('throws on a 5xx server error', () => {
    const res = new Response('boom', { status: 503 });
    expect(() => validateResponse(res)).toThrow(/503/);
  });
});
