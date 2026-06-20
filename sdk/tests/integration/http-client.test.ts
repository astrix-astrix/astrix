import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AstrixClient } from '../../src/index.js';

describe('AstrixClient HTTP integration', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer((request, response) => {
      response.setHeader('content-type', 'application/json');

      if (request.url === '/health') {
        response.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      response.statusCode = 404;
      response.end(JSON.stringify({ error: 'not found' }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected test server to listen on a TCP port');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('parses JSON from a real HTTP response', async () => {
    const client = new AstrixClient({ baseUrl });

    await expect(client.health()).resolves.toEqual({ status: 'ok' });
  });
});
