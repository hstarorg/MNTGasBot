import type {
  ApiClient,
  TransactionQueryFilter,
  TransferEventsFilter,
} from '../types';

export class Account {
  private readonly module = 'account';
  constructor(private readonly apiClient: ApiClient) {}

  async getEtherBalance(
    address: string,
    options?: { tag?: 'earliest' | 'pending' | 'latest' },
  ) {
    const params: Record<string, any> = { address };
    if (options?.tag) {
      params.tag = options.tag;
    }
    return this.apiClient.get(this.module, 'balance', params);
  }

  async batchGetEtherBalance(
    addressList: string[],
    options?: { tag?: 'earliest' | 'pending' | 'latest' },
  ) {
    const params: Record<string, any> = { address: addressList.join(',') };
    if (options?.tag) {
      params.tag = options.tag;
    }
    return this.apiClient.get(this.module, 'balancemulti', params);
  }

  async queryTransactions(address: string, options?: TransactionQueryFilter) {
    const params = this.getCheckedParams(options);
    return this.apiClient
      .get(this.module, 'txlist', { ...params, address })
      .then((rows) => {
        return { rows, page: params.page, size: params.offset };
      });
  }

  async queryInternalTransactions(
    address: string,
    options?: TransactionQueryFilter,
  ) {
    const params = this.getCheckedParams(options);
    return this.apiClient
      .get(this.module, 'txlistinternal', { ...params, address })
      .then((rows) => {
        return { rows, page: params.page, size: params.offset };
      });
  }

  async queryInternalTransactionsByHash(txHash: string) {
    return this.apiClient.get(this.module, 'txlistinternal', {
      txhash: txHash,
    });
  }

  /**
   * ERC20
   * @param addressFilter
   * @param options
   * @returns
   */
  async queryTokenTransferEvents(
    addressFilter:
      | { address: string; contractaddress?: string }
      | { contractaddress: string; address?: string },
    options?: TransferEventsFilter,
  ) {
    const params = this.getCheckedParams(options);
    return this.apiClient.get(this.module, 'tokentx', {
      ...params,
      ...addressFilter,
    });
  }

  /**
   * ERC721
   * @param addressFilter
   * @param options
   * @returns
   */
  async queryNFTTransferEvents(
    addressFilter:
      | { address: string; contractaddress?: string }
      | { contractaddress: string; address?: string },
    options?: TransferEventsFilter,
  ) {
    const params = this.getCheckedParams(options);
    return this.apiClient.get(this.module, 'tokennfttx', {
      ...params,
      ...addressFilter,
    });
  }

  /**
   * ERC 1155
   * @param addressFilter
   * @param options
   * @returns
   */
  async queryERC1155TransferEvents(
    addressFilter:
      | { address: string; contractaddress?: string }
      | { contractaddress: string; address?: string },
    options?: TransferEventsFilter,
  ) {
    const params = this.getCheckedParams(options);
    return this.apiClient.get(this.module, 'token1155tx', {
      ...params,
      ...addressFilter,
    });
  }

  private getCheckedParams(
    options: TransactionQueryFilter | TransferEventsFilter,
  ) {
    const params: Record<string, any> = {};

    params.page = options?.page ?? 1;
    params.offset = options?.offset ?? 10;

    if (options?.sort !== undefined) {
      params.sort = options.sort;
    }
    if (options?.startblock !== undefined) {
      params.startblock = options.startblock;
    }
    if (options?.endblock !== undefined) {
      params.endblock = options.endblock;
    }
    return params;
  }
}
