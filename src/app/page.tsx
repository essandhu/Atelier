import { loadProfile } from '@/data/loaders/projects';
import {
  fetchGithubSnapshot,
  GithubFetchError,
} from '@/data/github/client';
import type { GithubSnapshot } from '@/data/github/types';

type FetchResult =
  | { ok: true; snapshot: GithubSnapshot }
  | { ok: false; message: string };

const loadSnapshot = async (username: string): Promise<FetchResult> => {
  try {
    const snapshot = await fetchGithubSnapshot(username);
    return { ok: true, snapshot };
  } catch (err) {
    if (err instanceof GithubFetchError) {
      return { ok: false, message: err.message };
    }
    return { ok: false, message: (err as Error).message ?? 'unknown error' };
  }
};

const totalContributions = (snapshot: GithubSnapshot): number =>
  snapshot.contributions.reduce((sum, day) => sum + day.count, 0);

const DebugPage = async (): Promise<React.ReactElement> => {
  const profile = loadProfile();
  const result = await loadSnapshot(profile.githubUsername);

  return (
    <main
      style={{
        padding: '2rem',
        fontFamily:
          'ui-serif, Georgia, "Times New Roman", serif',
        maxWidth: '60rem',
        margin: '0 auto',
        lineHeight: 1.6,
      }}
    >
      <header>
        <h1 style={{ fontWeight: 400, letterSpacing: '-0.01em' }}>
          {profile.name}
        </h1>
        <p style={{ color: '#555', marginTop: 0 }}>{profile.role}</p>
      </header>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888' }}>
          Contributions, last 90 days
        </h2>
        {result.ok ? (
          <p style={{ fontSize: '3rem', margin: '0.5rem 0', fontWeight: 300 }}>
            <span data-testid="contribution-total">
              {totalContributions(result.snapshot)}
            </span>
          </p>
        ) : (
          <p>
            GitHub pipeline unavailable —{' '}
            <em>{result.message}</em>
          </p>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888' }}>
          Raw snapshot
        </h2>
        <pre
          style={{
            background: '#f6f5f1',
            padding: '1rem',
            overflow: 'auto',
            border: '1px solid #e5e3dc',
            fontSize: '0.8rem',
          }}
        >
          {result.ok
            ? JSON.stringify(result.snapshot, null, 2)
            : JSON.stringify({ error: result.message }, null, 2)}
        </pre>
      </section>
    </main>
  );
};

export default DebugPage;
