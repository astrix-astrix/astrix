import { fileURLToPath } from 'node:url';
import { createCache } from './cache/redis.js';
import { buildApp } from './app.js';
import { createDb } from './db/knex.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const db = createDb(env.DATABASE_URL);
const cache = await createCache(env.REDIS_URL);
const adminRoot = fileURLToPath(new URL('../../app/build/', import.meta.url));
const app = await buildApp({
  env,
  db,
  cache,
  adminRoot: env.NODE_ENV === 'production' ? adminRoot : undefined
});

await db.migrate.latest();

const shutdown = async () => {
  await app.close();
  await cache.quit();
  await db.destroy();
};

process.on('SIGINT', () => void shutdown().then(() => process.exit(0)));
process.on('SIGTERM', () => void shutdown().then(() => process.exit(0)));

await app.listen({
  host: env.API_HOST,
  port: env.API_PORT
});
