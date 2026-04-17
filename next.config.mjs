import { withSentryConfig } from '@sentry/nextjs';

const isDev = process.env.NODE_ENV !== 'production';

// Next.js HMR + R3F shader compilation rely on eval in dev; production builds
// do not. Phase 5 tightens `'unsafe-inline'` (dev tooling still needs it).
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com"
  : "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com";

const cspDirectives = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.githubusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.github.com https://*.vercel-insights.com https://*.sentry.io",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
];

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  { key: 'Permissions-Policy', value: 'camera=(self)' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const withSentry = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(baseConfig, {
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : baseConfig;

export default withSentry;
