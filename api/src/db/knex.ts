import path from 'node:path';
import knex, { type Knex } from 'knex';

export function createKnexConfig(databaseUrl = process.env.DATABASE_URL): Knex.Config {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  return {
    client: 'pg',
    connection: databaseUrl,
    pool: {
      min: 0,
      max: 10
    },
    migrations: {
      directory: path.join(process.cwd(), 'migrations')
    }
  };
}

export function createDb(databaseUrl?: string): Knex {
  return knex(createKnexConfig(databaseUrl));
}
