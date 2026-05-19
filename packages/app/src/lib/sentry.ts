// Sentry initialization. No-op when SENTRY_DSN is not set, so dev/CI don't
// emit phantom traffic. In prod, errors from any unhandled exception in a
// Hono handler get captured with request-id tagging.

import { env } from '@mentivue/shared/config';
import * as Sentry from '@sentry/bun';
import type { MiddlewareHandler } from 'hono';
import { logger } from './logger.ts';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!env.SENTRY_DSN) return; // silent no-op
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
  });
  initialized = true;
  logger.info('Sentry initialized');
}

export function isSentryEnabled(): boolean {
  return initialized;
}

// Hono middleware: catch unhandled exceptions, capture in Sentry with request-id
// tag, then re-throw so Hono's onError still runs. Mount after requestLogger so
// `c.get('requestId')` is available.
export const sentryMiddleware: MiddlewareHandler = async (c, next) => {
  if (!initialized) return next();
  try {
    await next();
  } catch (err) {
    const reqId = c.get('requestId');
    Sentry.withScope((scope) => {
      if (reqId) scope.setTag('request_id', reqId);
      scope.setTag('method', c.req.method);
      scope.setTag('path', c.req.path);
      Sentry.captureException(err);
    });
    throw err;
  }
};
