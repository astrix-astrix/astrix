import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Knex } from 'knex';
import type { CacheClient } from '../../src/cache/redis.js';
import { createCache } from '../../src/cache/redis.js';
import { buildApp } from '../../src/app.js';
import { createDb } from '../../src/db/knex.js';
import { loadEnv } from '../../src/env.js';

describe('api e2e', () => {
  let app: FastifyInstance;
  let db: Knex;
  let cache: CacheClient;

  beforeAll(async () => {
    const env = loadEnv();
    db = createDb(env.DATABASE_URL);
    cache = await createCache(env.REDIS_URL);
    await db.migrate.latest();
    app = await buildApp({ env, db, cache, logger: false });
  });

  afterAll(async () => {
    await app?.close();
    await cache?.quit();
    await db?.destroy();
  });

  it('reports readiness through the HTTP contract', async () => {
    const response = await app.inject('/ready');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ready' });
  });
});
