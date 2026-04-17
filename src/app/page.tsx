import {
  fetchGithubSnapshot,
  GithubFetchError,
} from '@/data/github/client';
import type { GithubSnapshot } from '@/data/github/types';
import { loadProfile, loadProjects } from '@/data/loaders/projects';
import { Scene } from '@/scene/Scene';

const emptySnapshot = (username: string): GithubSnapshot => ({
  fetchedAt: new Date().toISOString(),
  username,
  contributions: [],
  events: [],
});

const safeFetch = async (username: string): Promise<GithubSnapshot> => {
  try {
    return await fetchGithubSnapshot(username);
  } catch (err) {
    if (err instanceof GithubFetchError || err instanceof Error) {
      return emptySnapshot(username);
    }
    return emptySnapshot(username);
  }
};

const HomePage = async (): Promise<React.ReactElement> => {
  const profile = loadProfile();
  const projects = loadProjects();
  const githubSnapshot = await safeFetch(profile.githubUsername);

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
