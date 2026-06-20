export interface AstrixClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface HealthResponse {
  status: 'ok';
}

export interface ReadyResponse {
  status: 'ready';
}

export interface PingResponse {
  data: {
    message: 'pong';
  };
}

export class AstrixClient {
  private readonly baseUrl: URL;
  private readonly fetcher: typeof fetch;

  constructor(options: AstrixClientOptions = {}) {
    this.baseUrl = new URL(options.baseUrl ?? 'http://127.0.0.1:8333');
    this.fetcher = options.fetch ?? fetch;
  }

  test(): string {
    return 'test 123 hello';
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async ready(): Promise<ReadyResponse> {
    return this.request<ReadyResponse>('/ready');
  }

  async ping(): Promise<PingResponse> {
    return this.request<PingResponse>('/v1/ping');
  }

  private async request<TResponse>(path: string): Promise<TResponse> {
    const response = await this.fetcher(new URL(path, this.baseUrl));

    if (!response.ok) {
      throw new Error(`Astrix API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as TResponse;
  }
}
