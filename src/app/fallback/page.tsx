import {
  loadProfile,
  loadProjects,
  loadSkills,
} from '@/data/loaders/projects';
import {
  fetchGithubSnapshot,
  GithubFetchError,
} from '@/data/github/client';

const fetchTotal = async (username: string): Promise<number | null> => {
  try {
    const snapshot = await fetchGithubSnapshot(username);
    return snapshot.contributions.reduce((sum, day) => sum + day.count, 0);
  } catch (err) {
    if (err instanceof GithubFetchError) {
      return null;
    }
    throw err;
  }
};

// Intentionally unstyled beyond the browser defaults. Phase 5 owns the
// fully-styled fallback. This page exists so no-JS visitors still read the
// portfolio as semantic HTML.
const FallbackPage = async (): Promise<React.ReactElement> => {
  const profile = loadProfile();
  const projects = loadProjects();
  const skills = loadSkills();
  const total = await fetchTotal(profile.githubUsername);

  return (
    <main>
      <a href="#content">Skip to content</a>
      <nav aria-label="Fallback sections">
        <ul>
          <li>
            <a href="#profile">Profile</a>
          </li>
          <li>
            <a href="#projects">Projects</a>
          </li>
          <li>
            <a href="#skills">Skills</a>
          </li>
          <li>
            <a href="#activity">Activity</a>
          </li>
        </ul>
      </nav>

      <div id="content">
        <section id="profile">
          <h1>{profile.name}</h1>
          <p>{profile.role}</p>
          <p>{profile.city}</p>
          <p>{profile.positioning}</p>
        </section>

        <section id="projects">
          <h2>Projects</h2>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="skills">
          <h2>Skills</h2>
          <ul>
            {skills.map((skill) => (
              <li key={skill.id}>
                {skill.label} ({skill.category}, {skill.years} years)
              </li>
            ))}
          </ul>
        </section>

        <section id="activity">
          <h2>GitHub activity</h2>
          {total === null ? (
            <p>GitHub activity is temporarily unavailable.</p>
          ) : (
            <p>
              Contributions, last 90 days:{' '}
              <strong data-testid="contribution-total-fallback">{total}</strong>
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default FallbackPage;
