import { withSentryConfig } from '@sentry/nextjs';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.githubusercontent.com",
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
