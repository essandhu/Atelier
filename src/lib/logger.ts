import 'server-only';
import pino, { type Logger } from 'pino';
import { env } from '@/lib/env';

const base = {
  app: 'atelier',
  env: env.VERCEL_ENV,
};

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  base,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export const withReqId = (reqId: string): Logger => logger.child({ reqId });
