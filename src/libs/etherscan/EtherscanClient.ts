import axios, { AxiosInstance } from 'axios';
import { Account } from './lib/Account';
import { Contract } from './lib/Contract';
import { Proxy } from './lib/Proxy';
import type { ApiClient, ClientOptions } from './types';
import { CHAIN_API_URL_MAP } from './constants';

export class EtherscanClient {
  private apiClient: ApiClient = {
    get: this.get.bind(this),
  };
  private readonly client: AxiosInstance;
  constructor(readonly options: ClientOptions) {
    const baseUrl =
      options.apiUrl || CHAIN_API_URL_MAP[options.chain || 'mainnet'];

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: options.timeout ?? 3000,
    });
  }

  account = new Account(this.apiClient);

  contract = new Contract(this.apiClient);

  proxy = new Proxy(this.apiClient);

  private async get(
    module: string,
    action: string,
    params: Record<string, any>,
  ) {
    return this.client
      .get('/api', {
        params: {
          ...params,
          module,
          action,
          apikey: this.options.apiKey || '',
        },
      })
      .then((res) => {
        if (res.status < 200 || res.status >= 300) {
          // request error
          return Promise.reject(res);
        }
        const resData = res.data;
        if (resData.jsonrpc) {
          // is proxy request
          return resData.result;
        }
        if (resData.status !== '1') {
          // api return error
          return Promise.reject(resData);
        }
        return resData.result;
      });
  }
}
