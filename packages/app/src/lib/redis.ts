// Singleton Redis client for the app. Reused by rate-limit middleware.
// Lazy-connected so dev boots without Redis if the limiter isn't on the path.

import { env } from '@mentivue/shared/config';
import Redis from 'ioredis';

let cached: Redis | null = null;

export function redis(): Redis {
  if (!cached) {
    cached = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });
    cached.on('error', (err) => console.error('Redis error:', err.message));
  }
  return cached;
}
