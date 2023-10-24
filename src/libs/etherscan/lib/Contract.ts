import type { ApiClient } from '../types';

export class Contract {
  private readonly module = 'contract';
  constructor(private readonly apiClient: ApiClient) {}

  async getContractABI(contractAddress: string) {
    return this.apiClient.get(this.module, 'getabi', {
      address: contractAddress,
    });
  }

  async getContractSourceCode(contractAddress: string) {
    return this.apiClient.get(this.module, 'getsourcecode', {
      address: contractAddress,
    });
  }

  async batchGetContractCreationAndTxHash(contractAddressList: string[]) {
    return this.apiClient.get(this.module, 'getcontractcreation', {
      contractaddresses: contractAddressList.join(','),
    });
  }
}
