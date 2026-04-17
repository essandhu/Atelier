import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { loadProfile } from '@/data/loaders/projects';
import { WebVitalsReporter } from '@/telemetry/web-vitals';
import { AccentProvider } from '@/ui/controls/AccentProvider';
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
    <body>
      <AccentProvider>{children}</AccentProvider>
      <noscript>
        You need JavaScript to view the interactive scene. Visit{' '}
        <a href="/fallback">the text version</a>.
      </noscript>
      <WebVitalsReporter />
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
