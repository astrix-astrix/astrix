import { createClient, type RedisClientType } from 'redis';

export type CacheClient = RedisClientType;

export async function createCache(url = process.env.REDIS_URL): Promise<CacheClient> {
  if (!url) {
    throw new Error('REDIS_URL is required');
  }

  const client = createClient({ url });
  client.on('error', (error) => {
    console.error('Redis client error', error);
  });
  await client.connect();
  return client as CacheClient;
}
