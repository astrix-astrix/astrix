import { describe, expect, it, vi } from 'vitest';
import { AstrixClient } from '../../src/index.js';

describe('AstrixClient', () => {
  it('calls the ping endpoint', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: { message: 'pong' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const client = new AstrixClient({
      baseUrl: 'http://api.example.test',
      fetch: fetcher
    });

    await expect(client.ping()).resolves.toEqual({ data: { message: 'pong' } });
    expect(fetcher).toHaveBeenCalledWith(new URL('http://api.example.test/v1/ping'));
  });

  it('throws on non-ok responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('nope', { status: 500 }));
    const client = new AstrixClient({ fetch: fetcher });

    await expect(client.health()).rejects.toThrow('Astrix API request failed: 500');
  });
});
