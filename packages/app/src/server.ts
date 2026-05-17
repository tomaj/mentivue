import { Hono } from 'hono';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => c.text('Mentivue app server running.'));
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const port = Number(process.env.APP_PORT ?? 3000);
console.log(`🦊 Mentivue app server: http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
