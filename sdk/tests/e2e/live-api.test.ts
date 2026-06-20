import { describe, expect, it } from 'vitest';
import { AstrixClient } from '../../src/index.js';

describe('AstrixClient e2e', () => {
  it('calls the running API', async () => {
    const client = new AstrixClient({
      baseUrl: process.env.SDK_E2E_API_URL ?? 'http://127.0.0.1:8333'
    });

    await expect(client.ping()).resolves.toEqual({ data: { message: 'pong' } });
  });
});
