import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';

const env = {
  API_LOG_LEVEL: 'silent',
  CORS_ORIGIN: 'http://localhost:5173'
} as const;

describe('app', () => {
  it('returns health status', async () => {
    const app = await buildApp({ env, logger: false });
    const response = await app.inject('/health');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await app.close();
  });

  it('returns the ping contract', async () => {
    const app = await buildApp({ env, logger: false });
    const response = await app.inject('/v1/ping');

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { message: 'pong' } });

    await app.close();
  });

  it('serves the admin SPA and its client-side routes', async () => {
    const adminRoot = await mkdtemp(join(tmpdir(), 'astrix-admin-'));
    await writeFile(join(adminRoot, 'index.html'), '<h1>Astrix Admin</h1>');
    const app = await buildApp({ env, logger: false, adminRoot });

    const rootResponse = await app.inject('/admin');
    const routeResponse = await app.inject('/admin/collections');

    expect(rootResponse.statusCode).toBe(302);
    expect(rootResponse.headers.location).toBe('/admin/');
    expect(routeResponse.statusCode).toBe(200);
    expect(routeResponse.body).toContain('Astrix Admin');
    expect(routeResponse.headers['content-security-policy']).toBeUndefined();

    await app.close();
    await rm(adminRoot, { recursive: true, force: true });
  });
});
