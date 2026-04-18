import type { Page } from '@playwright/test';

export type WebcamMockOutcome = 'granted' | 'denied' | 'unsupported';

/**
 * Install a page-init script that replaces `navigator.mediaDevices.getUserMedia`
 * with a synthetic implementation. The stream is produced by `<canvas>.captureStream()`
 * which is standards-compliant — its `MediaStreamTrack.readyState` flips to
 * `'ended'` when `stop()` is called, exactly mirroring a real camera.
 *
 * The install also hangs a `window.__atelierMockCalls` record so specs can
 * assert call counts (e.g. reduced-motion must not call getUserMedia at all).
 */
export const installWebcamMock = async (
  page: Page,
  outcome: WebcamMockOutcome,
): Promise<void> => {
  await page.addInitScript((outcomeArg) => {
    const w = window as unknown as {
      __atelierMockCalls?: { getUserMedia: number };
    };
    w.__atelierMockCalls = { getUserMedia: 0 };

    if (outcomeArg === 'unsupported') {
      try {
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: undefined,
        });
      } catch {
        // Fallback: null out getUserMedia itself
        if (navigator.mediaDevices) {
          (navigator.mediaDevices as unknown as Record<string, unknown>)
            .getUserMedia = undefined;
        }
      }
      return;
    }

    const fakeGetUserMedia = (
      _c: MediaStreamConstraints,
    ): Promise<MediaStream> => {
      if (w.__atelierMockCalls) w.__atelierMockCalls.getUserMedia += 1;
      if (outcomeArg === 'denied') {
        const err = new Error('denied');
        err.name = 'NotAllowedError';
        return Promise.reject(err);
      }
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 320, 240);
      }
      type CaptureCanvas = HTMLCanvasElement & {
        captureStream: (frameRate?: number) => MediaStream;
      };
      const stream = (canvas as CaptureCanvas).captureStream(30);
      return Promise.resolve(stream);
    };

    // Ensure mediaDevices exists, then override getUserMedia on it. If the
    // navigator lacks a mediaDevices in the test environment, install a
    // plain object with just the method we need.
    const nav = navigator as Navigator & {
      mediaDevices?: { getUserMedia?: typeof fakeGetUserMedia };
    };
    if (!nav.mediaDevices) {
      try {
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: { getUserMedia: fakeGetUserMedia },
        });
      } catch {
        (nav as unknown as Record<string, unknown>).mediaDevices = {
          getUserMedia: fakeGetUserMedia,
        };
      }
    } else {
      (nav.mediaDevices as unknown as Record<string, unknown>).getUserMedia =
        fakeGetUserMedia;
    }
  }, outcome);
};

export const getGumCallCount = async (page: Page): Promise<number> => {
  return await page.evaluate(() => {
    const w = window as unknown as {
      __atelierMockCalls?: { getUserMedia: number };
    };
    return w.__atelierMockCalls?.getUserMedia ?? 0;
  });
};
