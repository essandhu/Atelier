import {
  fetchGithubSnapshot,
  GithubFetchError,
  loadFixtureSnapshot,
} from '@/data/github/client';
import type { GithubSnapshot } from '@/data/github/types';
import { loadProfile, loadProjects } from '@/data/loaders/projects';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { Scene } from '@/scene/Scene';

const safeFetch = async (
  username: string,
): Promise<GithubSnapshot | null> => {
  try {
    return await fetchGithubSnapshot(username);
  } catch (err) {
    if (err instanceof GithubFetchError || err instanceof Error) {
      logger.error({ err, username }, 'page.github_fetch_failed');
      return null;
    }
    logger.error({ err, username }, 'page.github_fetch_failed');
    return null;
  }
};

const HomePage = async (): Promise<React.ReactElement> => {
  const profile = loadProfile();
  const projects = loadProjects();
  const githubSnapshot =
    env.NEXT_PUBLIC_GITHUB_MODE === 'fixture'
      ? await loadFixtureSnapshot()
      : await safeFetch(profile.githubUsername);

  return (
    <main className="min-h-[100dvh]">
      <Scene
        githubSnapshot={githubSnapshot}
        profile={profile}
        projects={projects}
      />
    </main>
  );
};

export default HomePage;
