export const GITHUB_ACTIVITY_TAG = 'github-activity';
export const GITHUB_HEALTH_TAG = 'github-health';

export const REVALIDATE_TAG_ALLOWLIST = [
  GITHUB_ACTIVITY_TAG,
  GITHUB_HEALTH_TAG,
] as const;

export type RevalidateTag = (typeof REVALIDATE_TAG_ALLOWLIST)[number];

export interface GithubFetchOptions {
  next: { tags: string[]; revalidate: number };
}

export const githubFetchOptions = (
  tag: string,
  revalidateSec = 3600,
): GithubFetchOptions => ({
  next: { tags: [tag], revalidate: revalidateSec },
});
