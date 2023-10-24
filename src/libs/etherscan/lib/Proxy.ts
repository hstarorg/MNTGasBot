import type { ApiClient } from '../types';

export class Proxy {
  private readonly module = 'proxy';
  constructor(private readonly apiClient: ApiClient) {}

  async getTransactionCount(
    address: string,
    options?: { tag?: 'earliest' | 'pending' | 'latest' },
  ) {
    const params: Record<string, any> = { address };
    if (options?.tag) {
      params.tag = options.tag;
    }
    return this.apiClient
      .get(this.module, 'eth_getTransactionCount', params)
      .then((data) => parseInt(data, 16));
  }

  async getGasPrice() {
    return this.apiClient.get(this.module, 'eth_gasPrice', {});
  }
}
