import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { EthereumChainService } from './chain-services/ethereum-chain.service';

@Injectable()
export class TaskSchedulingService {
  constructor(private readonly ethereumChainService: EthereumChainService) {}

  /**
   * 每隔 9s 查询一次 USDT 的转账记录
   * @returns
   */
  @Interval(9000)
  async queryEthereumERC20Transactions() {
    await this.ethereumChainService.queryEthereumERC20Transactions();
  }

  @Interval(8000)
  async processERC20Transaction() {
    await this.ethereumChainService.processERC20Transaction();
  }
}
