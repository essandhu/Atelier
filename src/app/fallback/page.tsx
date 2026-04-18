import Link from 'next/link';
import {
  loadExperience,
  loadProfile,
  loadProjects,
  loadSkills,
} from '@/data/loaders/projects';
import {
  fetchGithubSnapshot,
  GithubFetchError,
  loadFixtureSnapshot,
} from '@/data/github/client';
import type { Project } from '@/content/projects/schemas';
import { groupSkills } from '@/content/skills/grouping';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const fetchTotal = async (username: string): Promise<number | null> => {
  try {
    const snapshot =
      env.NEXT_PUBLIC_GITHUB_MODE === 'fixture'
        ? await loadFixtureSnapshot()
        : await fetchGithubSnapshot(username);
    return snapshot.contributions.reduce((sum, day) => sum + day.count, 0);
  } catch (err) {
    if (err instanceof GithubFetchError) return null;
    throw err;
  }
};

const renderProjectItem = (project: Project): React.ReactElement => {
  return (
    <article
      key={project.id}
      className="border-l-2 pl-5 py-2"
      style={{ borderColor: 'var(--accent)' }}
    >
      <header className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-xl font-semibold tracking-tight">
          {project.title}
        </h3>
      </header>
      <p className="mt-1 text-sm opacity-70 italic">{project.role}</p>
      <p className="mt-3 leading-relaxed">{project.summary}</p>
      {project.stack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Stack">
          {project.stack.map((item) => (
            <li
              key={item}
              className="text-xs px-2 py-0.5 rounded-sm font-mono"
              style={{
                background:
                  'color-mix(in oklab, var(--color-ink) 8%, transparent)',
                color: 'color-mix(in oklab, var(--color-ink) 85%, transparent)',
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      {project.links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-4 text-sm">
          {project.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{
                  textDecorationColor: 'var(--accent)',
                  textUnderlineOffset: '3px',
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

const FallbackPage = async (): Promise<React.ReactElement> => {
  const profile = loadProfile();
  const projects = loadProjects();
  const skills = loadSkills();
  const experience = loadExperience();
  const total = await fetchTotal(profile.githubUsername);

  logger.info({ page: 'fallback' }, 'fallback_viewed');

  const skillGroups = groupSkills(skills);

  return (
    <main
      className="min-h-[100dvh] px-6 py-16 md:px-12 md:py-24"
      style={{ maxWidth: '68ch', marginInline: 'auto' }}
    >
      <nav
        aria-label="Sections"
        className="mb-12 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] opacity-60"
      >
        <a href="#profile" className="hover:opacity-100">Profile</a>
        <a href="#projects" className="hover:opacity-100">Projects</a>
        <a href="#skills" className="hover:opacity-100">Skills</a>
        <a href="#experience" className="hover:opacity-100">Experience</a>
        <a href="#activity" className="hover:opacity-100">Activity</a>
      </nav>

      <section id="profile" className="mb-20">
        <p
          className="text-[0.7rem] uppercase tracking-[0.28em] mb-4"
          style={{ color: 'var(--accent)' }}
        >
          Text-only edition
        </p>
        <h1 className="text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
          {profile.name}
        </h1>
        <p className="mt-4 text-lg opacity-80">{profile.role}</p>
        <p className="mt-6 text-lg leading-relaxed max-w-[52ch]">
          {profile.positioning}
        </p>
        <p className="mt-8 text-sm opacity-60">{profile.location}</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li>
            <a
              href={`mailto:${profile.contacts.email}`}
              className="underline"
              style={{
                textDecorationColor: 'var(--accent)',
                textUnderlineOffset: '3px',
              }}
            >
              {profile.contacts.email}
            </a>
          </li>
          {profile.contacts.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{
                  textDecorationColor: 'var(--accent)',
                  textUnderlineOffset: '3px',
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
          {profile.contacts.resumeUrl && (
            <li>
              <a
                href={profile.contacts.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{
                  textDecorationColor: 'var(--accent)',
                  textUnderlineOffset: '3px',
                }}
              >
                Résumé (PDF)
              </a>
            </li>
          )}
        </ul>
      </section>

      <section id="projects" className="mb-20">
        <h2
          className="text-xs uppercase tracking-[0.28em] mb-6"
          style={{ color: 'var(--accent)' }}
        >
          Projects
        </h2>
        <div className="space-y-10">
          {projects.map(renderProjectItem)}
        </div>
      </section>

      <section id="skills" className="mb-20">
        <h2
          className="text-xs uppercase tracking-[0.28em] mb-6"
          style={{ color: 'var(--accent)' }}
        >
          Skills
        </h2>
        <dl className="space-y-6">
          {skillGroups.map((group) => (
            <div key={group.category}>
              <dt className="text-sm uppercase tracking-widest opacity-60 mb-2">
                {group.label}
              </dt>
              <dd>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {group.skills.map((skill) => (
                    <li key={skill.id} className="text-sm font-mono">
                      {skill.label}
                      <span className="opacity-70">
                        {' · '}
                        {skill.years}y
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="experience" className="mb-20">
        <h2
          className="text-xs uppercase tracking-[0.28em] mb-6"
          style={{ color: 'var(--accent)' }}
        >
          Experience
        </h2>
        <ol className="space-y-8">
          {experience.map((entry) => (
            <li key={entry.id}>
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <h3 className="text-lg font-semibold">{entry.title}</h3>
                <span className="opacity-70">— {entry.company}</span>
                <span className="ml-auto text-sm opacity-60 font-mono">
                  {entry.start} – {entry.end ?? 'present'}
                </span>
              </div>
              <p className="leading-relaxed mb-2">{entry.summary}</p>
              {entry.highlights.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5 text-sm opacity-90">
                  {entry.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section id="activity" className="mb-20">
        <h2
          className="text-xs uppercase tracking-[0.28em] mb-6"
          style={{ color: 'var(--accent)' }}
        >
          GitHub Activity
        </h2>
        {total === null ? (
          <p className="opacity-70">
            GitHub activity is temporarily unavailable.
          </p>
        ) : (
          <p className="text-lg">
            <span className="opacity-70">Contributions, last 90 days: </span>
            <strong
              data-testid="contribution-total-fallback"
              className="font-mono text-2xl"
              style={{ color: 'var(--accent)' }}
            >
              {total}
            </strong>
          </p>
        )}
      </section>

      <footer
        className="pt-8 border-t text-xs opacity-70"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-ink) 12%, transparent)',
        }}
      >
        <Link href="/" className="underline">
          Return to the interactive edition
        </Link>
      </footer>
    </main>
  );
};

export default FallbackPage;
