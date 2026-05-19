// Structured logger (pino) + request-id middleware for Hono.
// Pretty-prints in dev, JSON in prod. Each request gets an `x-request-id`
// header (echoed back to the client) and a child logger bound to that id.

import { randomBytes } from 'node:crypto';
import { env } from '@mentivue/shared/config';
import type { MiddlewareHandler } from 'hono';
import pino, { type Logger } from 'pino';

const isDev = env.NODE_ENV !== 'production';

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  base: { app: 'mentivue-app' },
  // Pretty-print only outside production; production wants newline-delimited JSON.
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,app' },
        },
      }
    : {}),
});

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    log: Logger;
  }
}

// Generates / propagates X-Request-Id, attaches a child logger to the context,
// and logs request start + duration. Replaces hono/logger which only emits
// unstructured console lines.
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const incoming = c.req.header('x-request-id');
  const requestId =
    incoming && /^[a-zA-Z0-9_-]{8,}$/.test(incoming) ? incoming : randomBytes(8).toString('hex');
  c.set('requestId', requestId);

  const child = logger.child({ reqId: requestId });
  c.set('log', child);

  const start = Date.now();
  child.debug({ method: c.req.method, path: c.req.path }, 'req start');
  await next();
  const ms = Date.now() - start;
  c.header('x-request-id', requestId);
  child.info({ method: c.req.method, path: c.req.path, status: c.res.status, ms }, 'req end');
};
