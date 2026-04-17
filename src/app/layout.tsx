import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { loadProfile } from '@/data/loaders/projects';
import { WebVitalsReporter } from '@/telemetry/web-vitals';
import { AccentProvider } from '@/ui/controls/AccentProvider';
import { SkipToFallback } from '@/ui/a11y/SkipToFallback';
import './globals.css';

export const metadata: Metadata = (() => {
  const profile = loadProfile();
  return {
    title: `${profile.name} — ${profile.role}`,
    description: profile.positioning,
    icons: { icon: '/favicon.svg' },
  };
})();

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps): React.ReactElement => (
  <html lang="en">
    <head>
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/fonts/inter-variable.woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/fonts/jetbrains-mono-variable.woff2"
        crossOrigin="anonymous"
      />
      {/* Meta-refresh lives in <head> so the redirect fires before <body>
          paints. The visible-fallback <noscript> below covers screen readers
          and the rare browser that ignores http-equiv refreshes. */}
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/fallback" />
      </noscript>
    </head>
    <body>
      <noscript>
        You need JavaScript to view the interactive scene. Visit{' '}
        <a href="/fallback">the text version</a>.
      </noscript>
      <SkipToFallback />
      <AccentProvider>{children}</AccentProvider>
      <WebVitalsReporter />
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
