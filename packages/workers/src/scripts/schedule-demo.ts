// Demo: schedule a single collection job to fire ~60 seconds from now,
// then exit. Workers must already be running (`pnpm dev:workers`) to
// pick it up.
//
// Usage:
//   pnpm --filter @mentivue/workers schedule:demo [provider]

import { and, eq } from 'drizzle-orm';
import { db, prompts } from '@mentivue/shared/db';
import { ALL_CLIENTS } from '@mentivue/shared/llm';
import { closeQueues, collectionQueue } from '../queues.ts';
import type { ProviderName } from '@mentivue/shared';

const requested = (process.argv[2] ?? 'openai') as ProviderName;
const candidate = ALL_CLIENTS.find((c) => c.provider === requested);
if (!candidate) {
  console.error(`✗ Unknown provider "${requested}". Options: anthropic, openai, perplexity, gemini`);
  process.exit(1);
}
if (!candidate.isAvailable()) {
  console.error(`✗ Provider ${requested} has no valid API key in .env`);
  process.exit(1);
}

const prompt = await db.query.prompts.findFirst({
  where: and(eq(prompts.isActive, true), eq(prompts.frequencyTier, 'daily')),
});
if (!prompt) {
  console.error('✗ No active daily prompts. Run `pnpm db:seed`.');
  process.exit(1);
}

const DELAY_MS = 60_000;
const job = await collectionQueue.add(
  'demo',
  {
    promptId: prompt.id,
    provider: requested,
    enableSearch: true,
  },
  {
    delay: DELAY_MS,
    attempts: 2,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { count: 100, age: 3600 },
    removeOnFail: { count: 50 },
  },
);

const fireAt = new Date(Date.now() + DELAY_MS);
console.log('▸ Demo job scheduled');
console.log(`  job id:   ${job.id}`);
console.log(`  prompt:   ${prompt.text}`);
console.log(`  provider: ${requested}`);
console.log(`  fires at: ${fireAt.toISOString()} (in ${Math.round(DELAY_MS / 1000)}s)`);
console.log('');
console.log('Make sure workers are running: pnpm dev:workers');
console.log('Watch the [collect] / [analyze] log lines there.');

await closeQueues();
process.exit(0);
