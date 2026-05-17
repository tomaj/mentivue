// Smoke test — queues N prompts × every available provider as collection
// jobs. Workers (started separately) pick them up and auto-chain to
// analysis. Use report:snapshot afterwards to see aggregated results.
//
// Usage:
//   pnpm --filter @mentivue/workers smoke:all [N]
//   N = how many prompts (default: 3)

import { and, eq } from 'drizzle-orm';
import { db, prompts } from '@mentivue/shared/db';
import { getAvailableClients } from '@mentivue/shared/llm';
import { closeQueues, collectionQueue } from '../queues.ts';

const N = Number.parseInt(process.argv[2] ?? '3', 10);

const clients = getAvailableClients();
if (clients.length === 0) {
  console.error('✗ No providers configured.');
  process.exit(1);
}

const promptList = await db.query.prompts.findMany({
  where: and(eq(prompts.isActive, true), eq(prompts.frequencyTier, 'daily')),
  limit: N,
});

if (promptList.length === 0) {
  console.error('✗ No active daily prompts in DB. Run `pnpm db:seed`.');
  process.exit(1);
}

const totalJobs = promptList.length * clients.length;
console.log(`▸ Smoke test`);
console.log(`  prompts:    ${promptList.length}`);
console.log(`  providers:  ${clients.map((c) => c.provider).join(', ')}`);
console.log(`  total jobs: ${totalJobs} collection + ${totalJobs} analysis (auto-chained)`);
console.log('');

const queued: Array<{ jobId: string; prompt: string; provider: string }> = [];
for (const p of promptList) {
  for (const c of clients) {
    const job = await collectionQueue.add(
      'smoke',
      {
        promptId: p.id,
        provider: c.provider,
        enableSearch: true,
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: { count: 200, age: 3600 },
        removeOnFail: { count: 100 },
      },
    );
    queued.push({
      jobId: String(job.id),
      prompt: p.text.slice(0, 50),
      provider: c.provider,
    });
  }
}

console.log(`✓ Queued ${queued.length} jobs:`);
for (const q of queued) {
  console.log(`  ${q.jobId.padStart(3)}  ${q.provider.padEnd(11)}  ${q.prompt}…`);
}
console.log('');
console.log('Workers must be running (`pnpm dev:workers`) to process these.');
console.log('Watch [collect]/[analyze] log lines or run `pnpm report:snapshot` later.');

await closeQueues();
process.exit(0);
