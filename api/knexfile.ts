import type { Knex } from 'knex';
import { createKnexConfig } from './src/db/knex.js';
import { loadEnv } from './src/env.js';

const env = loadEnv();

const config: Record<string, Knex.Config> = {
  development: createKnexConfig(env.DATABASE_URL),
  test: createKnexConfig(env.DATABASE_URL),
  production: createKnexConfig(env.DATABASE_URL)
};

export default config;
