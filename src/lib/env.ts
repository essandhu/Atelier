import 'server-only';
import { z } from 'zod';

const logLevel = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']);

const serverSchema = z.object({
  GITHUB_PAT: z.string().min(1, 'GITHUB_PAT is required'),
  GITHUB_USERNAME: z.string().min(1, 'GITHUB_USERNAME is required'),
  REVALIDATE_SECRET: z.string().min(1, 'REVALIDATE_SECRET is required'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  NEXT_PUBLIC_GITHUB_MODE: z.enum(['live', 'fixture']).default('live'),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  LOG_LEVEL: logLevel.default('info'),
  VERCEL_ENV: z
    .enum(['production', 'preview', 'development'])
    .default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

const parsed = serverSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('\n  ');
  throw new Error(`Invalid environment variables:\n  ${details}`);
}

const parsedClient = clientSchema.safeParse(process.env);
if (!parsedClient.success) {
  const details = parsedClient.error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('\n  ');
  throw new Error(`Invalid client environment variables:\n  ${details}`);
}

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

export const env: ServerEnv = parsed.data;
export const clientEnv: ClientEnv = parsedClient.data;
