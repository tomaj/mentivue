// Mentivue workers entry — boots BullMQ workers for collection + analysis.
// Auto-chains: completing a collection job enqueues an analysis job.
//
// Usage:
//   pnpm dev:workers
//
// To kick a demo run, in another terminal:
//   pnpm --filter @mentivue/workers schedule:demo

import { Worker } from 'bullmq';
import { analyzeResponse } from './agents/analyzer.ts';
import { runCollection } from './jobs/collect.ts';
import {
  QUEUE_NAMES,
  analysisQueue,
  closeQueues,
  connection,
  type AnalysisJobData,
  type CollectionJobData,
} from './queues.ts';

console.log('⚙️  Mentivue workers starting…');
console.log(`   Redis: ${process.env.REDIS_URL ?? '(default)'}`);

// ----------------------------------------------------------------------------
// Collection worker — calls an LLM provider, persists llm_calls + raw_response.
// On success, queues an analysis job for the new raw_response.
// ----------------------------------------------------------------------------
const collectionWorker = new Worker<CollectionJobData>(
  QUEUE_NAMES.collection,
  async (job) => {
    const start = Date.now();
    console.log(
      `[collect] ▸ ${job.id}  prompt=${job.data.promptId.slice(0, 8)}  ` +
        `provider=${job.data.provider}  search=${job.data.enableSearch}`,
    );
    const result = await runCollection(job.data);

    // Chain → analysis (only successful collections worth analyzing)
    await analysisQueue.add(
      'analyze',
      { rawResponseId: result.rawResponseId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    console.log(
      `[collect] ✓ ${job.id}  ${result.provider}  ` +
        `${result.inputTokens}in/${result.outputTokens}out  ` +
        `${result.citations}cites  $${result.costUsd.toFixed(6)}  ` +
        `${Date.now() - start}ms`,
    );
    return result;
  },
  {
    connection,
    concurrency: 4,
    limiter: { max: 10, duration: 1000 }, // 10 calls/s ceiling across workers
  },
);

// ----------------------------------------------------------------------------
// Analysis worker — extracts brand_mentions + response_quality.
// ----------------------------------------------------------------------------
const analysisWorker = new Worker<AnalysisJobData>(
  QUEUE_NAMES.analysis,
  async (job) => {
    const start = Date.now();
    console.log(`[analyze] ▸ ${job.id}  response=${job.data.rawResponseId.slice(0, 8)}`);
    const result = await analyzeResponse(job.data.rawResponseId);
    console.log(
      `[analyze] ✓ ${job.id}  ${result.mentionsInserted} mentions  ` +
        `q=${result.qualityScore.toFixed(1)}  refused=${result.refused ? 'Y' : 'N'}  ` +
        `$${result.analysisCostUsd.toFixed(6)}  ${Date.now() - start}ms` +
        (result.untrackedBrands.length > 0 ? `  untracked: ${result.untrackedBrands.join(', ')}` : ''),
    );
    return result;
  },
  { connection, concurrency: 2 },
);

// ----------------------------------------------------------------------------
// Error logging
// ----------------------------------------------------------------------------
for (const [name, worker] of Object.entries({ collection: collectionWorker, analysis: analysisWorker })) {
  worker.on('failed', (job, err) => {
    console.error(`[${name}] ✗ ${job?.id ?? '?'}  ${err.message}`);
  });
  worker.on('error', (err) => {
    console.error(`[${name}] worker error:`, err);
  });
}

// ----------------------------------------------------------------------------
// Graceful shutdown
// ----------------------------------------------------------------------------
async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — closing workers…`);
  await Promise.all([collectionWorker.close(), analysisWorker.close()]);
  await closeQueues();
  console.log('✓ Workers stopped.');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

console.log('✓ Workers initialized. Waiting for jobs…');
console.log('   Collection queue:', QUEUE_NAMES.collection);
console.log('   Analysis queue:  ', QUEUE_NAMES.analysis);
