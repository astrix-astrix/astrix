import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import type { CacheClient } from '../../src/cache/redis.js';
import { createCache } from '../../src/cache/redis.js';
import { createDb } from '../../src/db/knex.js';
import { loadEnv } from '../../src/env.js';

describe('db and cache integrations', () => {
  let db: Knex;
  let cache: CacheClient;

  beforeAll(async () => {
    const env = loadEnv();
    db = createDb(env.DATABASE_URL);
    cache = await createCache(env.REDIS_URL);
    await db.migrate.latest();
  });

  afterAll(async () => {
    await cache?.quit();
    await db?.destroy();
  });

  it('runs a postgres query through knex', async () => {
    const result = await db('health_checks').insert({ status: 'ok' }).returning(['id', 'status']);

    expect(result[0]?.status).toBe('ok');
  });

  it('runs a redis ping', async () => {
    await expect(cache.ping()).resolves.toBe('PONG');
  });
});
