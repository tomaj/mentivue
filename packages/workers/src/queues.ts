import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { getEnv } from '@mentivue/shared/config';
import type { ProviderName } from '@mentivue/shared';

const env = getEnv();

export const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// ----------------------------------------------------------------------------
// Job data shapes
// ----------------------------------------------------------------------------
export interface CollectionJobData {
  promptId: string;
  provider: ProviderName;
  enableSearch: boolean;
}

export interface AnalysisJobData {
  rawResponseId: string;
}

export interface PlanJobData {
  tier: 'daily' | 'weekly' | 'monthly';
}

// ----------------------------------------------------------------------------
// Queues
// ----------------------------------------------------------------------------
export const QUEUE_NAMES = {
  scheduler: 'mentivue-scheduler',
  collection: 'mentivue-collection',
  analysis: 'mentivue-analysis',
} as const;

export const schedulerQueue = new Queue<PlanJobData>(QUEUE_NAMES.scheduler, { connection });
export const collectionQueue = new Queue<CollectionJobData>(QUEUE_NAMES.collection, {
  connection,
});
export const analysisQueue = new Queue<AnalysisJobData>(QUEUE_NAMES.analysis, { connection });

export async function closeQueues(): Promise<void> {
  await Promise.all([schedulerQueue.close(), collectionQueue.close(), analysisQueue.close()]);
  await connection.quit();
}
