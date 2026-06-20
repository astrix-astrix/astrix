import path from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';

config({ path: path.resolve(process.cwd(), '../.env') });
config({ path: path.resolve(process.cwd(), '.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CORS_ORIGIN: z.string().default('http://127.0.0.1:8333'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1)
});

export type ApiEnv = z.infer<typeof EnvSchema>;

export function loadEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return EnvSchema.parse(env);
}
