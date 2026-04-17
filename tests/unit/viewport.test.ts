import { describe, expect, it } from 'vitest';
import { isMobileUA } from '@/lib/viewport';

describe('isMobileUA', () => {
  it('detects an iPhone Safari UA', () => {
    expect(
      isMobileUA(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(true);
  });

  it('detects an Android Chrome UA', () => {
    expect(
      isMobileUA(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe(true);
  });

  it('detects a Windows Phone UA', () => {
    expect(
      isMobileUA(
        'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; RM-1104) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.10166',
      ),
    ).toBe(true);
  });

  it('returns false for a desktop Chrome UA', () => {
    expect(
      isMobileUA(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      ),
    ).toBe(false);
  });

  it('returns false for an empty UA', () => {
    expect(isMobileUA('')).toBe(false);
  });

  it('does not classify an iPad as mobile (tablet excluded by design)', () => {
    expect(
      isMobileUA(
        'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
  });
});
