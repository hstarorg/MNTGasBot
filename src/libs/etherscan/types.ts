import { CHAIN_API_URL_MAP } from './constants';

export type ClientOptions = {
  /**
   * Etherscan API key, https://etherscan.io/apis
   */
  apiKey?: string;
  /**
   * Special chain name, default is `mainnet`
   */
  chain?: keyof typeof CHAIN_API_URL_MAP;

  /**
   * custom api url, if set, will ignore `chain` option
   */
  apiUrl?: string;

  /**
   * request timeout(ms), default is 3000(3s)
   */
  timeout?: number;
};

export type PagingFilter = {
  page?: number;
  offset?: number;
};

export type BlockFilter = {
  startblock?: number;
  endblock?: number;
};

export type SortFilter = {
  sort?: 'asc' | 'desc';
};

export type TransactionQueryFilter = PagingFilter & BlockFilter & SortFilter;

export type TransferEventsFilter = PagingFilter & BlockFilter & SortFilter;

export interface ApiClient {
  get(module: string, action: string, params?: any): Promise<any>;
}
