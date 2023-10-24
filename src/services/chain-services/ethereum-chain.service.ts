import { Injectable } from '@nestjs/common';
import { EtherscanClient } from '../../libs/etherscan';
import { Envs, GlobalConfig } from '../../constants';
import { db } from '../../utils';
import { PaymentType, ProcessStatus } from '../../types/transaction';
import { EthereumERC20Transaction, EthereumTransaction } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EthereumChainService {
  private ethereumCounter = 0;
  private erc20Counter = 0;

  private readonly etherscanClient: EtherscanClient;

  constructor(
    @InjectQueue(GlobalConfig.queueConf.txQueueName)
    private readonly txQueue: Queue,
  ) {
    this.etherscanClient = new EtherscanClient({
      apiKey: Envs.ETHERSCAN_APIKEY,
      chain: Envs.APP_ENV === 'prod' ? 'mainnet' : 'goerli',
      timeout: 5000,
    });
  }

  private async getLastEthereumTransactionFromDB(address: string) {
    const tx = await db.ethereumTransaction.findFirst({
      where: { mainAddress: address },
      orderBy: [{ receivedAt: 'desc' }],
    });
    return {
      blockNumber: Number(tx?.blockNumber || 0),
      transactionHash: tx?.id || '',
    };
  }
  async queryTransactions() {
    const queryId = `ethereum_${++this.ethereumCounter}`;
    console.time(queryId);
    console.log(`ethereum:start query ${queryId} transactions`, new Date());
    try {
      const receivingAddress = Envs.RECEIVING_ADDRESS;

      const lastTx = await this.getLastEthereumTransactionFromDB(
        receivingAddress,
      );

      const result: any[] =
        (
          await this.etherscanClient.account.queryTransactions(
            receivingAddress,

            {
              page: 1,
              offset: 50,
              startblock: lastTx.blockNumber,
              sort: 'asc',
            },
          )
        )?.rows || [];

      const lastTxIdx = result.findIndex(
        (x) => x.hash === lastTx.transactionHash,
      );
      const validTxList = result.slice(lastTxIdx + 1);

      console.log(
        `last block number = ${lastTx.blockNumber}, query txs count = ${result.length}, valid txs count = ${validTxList.length}`,
      );

      if (validTxList.length === 0) {
        console.log('ethereum: no new ethereum transactions, skip');
        return;
      }

      const transferItems: EthereumTransaction[] = [];
      for (const tx of validTxList) {
        let paymentType: PaymentType;
        if (tx.from === tx.to) {
        } else if (tx.from.toLowerCase() === receivingAddress.toLowerCase()) {
          paymentType = PaymentType.Out;
        } else {
          paymentType = PaymentType.In;
        }

        transferItems.push({
          id: tx.hash,
          mainAddress: receivingAddress,
          blockHash: tx.blockHash,
          blockNumber: tx.blockNumber,
          from: tx.from,
          to: tx.to,
          nonce: tx.nonce,
          value: tx.value,
          receivedAt: tx.timeStamp,
          paymentType,
          processStatus: ProcessStatus.Init,
          processAt: Date.now(),
          linkedTxHash: null,
        });
      }

      await db.ethereumTransaction.createMany({
        data: transferItems,
      });
    } catch (reason) {
      console.error(reason);
    } finally {
      console.timeEnd(queryId);
      console.log('\n');
    }
  }

  async queryEthereumERC20Transactions() {
    const queryId = `erc20_${++this.erc20Counter}`;
    console.time(queryId);
    console.log(`start query ${queryId} transactions`, new Date());
    try {
      const receivingAddress = Envs.RECEIVING_ADDRESS;
      const USDT_ContractAddress =
        GlobalConfig.chainConf[Envs.APP_ENV === 'prod' ? 'Mainnet' : 'Goerli']
          .USDT.contractAddress;

      const lastTx = await this.getLastERC20TransactionFromDB(receivingAddress);

      const result: any[] =
        await this.etherscanClient.account.queryTokenTransferEvents(
          {
            address: receivingAddress,
            contractaddress: USDT_ContractAddress,
          },
          {
            page: 1,
            offset: 50,
            startblock: lastTx.blockNumber,
            sort: 'asc',
          },
        );

      const lastTxIdx = result.findIndex(
        (x) => x.hash === lastTx.transactionHash,
      );
      const validTxList = result.slice(lastTxIdx + 1);

      console.log(
        `last block number = ${lastTx.blockNumber}, query txs count = ${result.length}, valid txs count = ${validTxList.length}`,
      );

      if (validTxList.length === 0) {
        console.log('no new erc20 transactions, skip');
        return;
      }

      const transferItems: EthereumERC20Transaction[] = [];
      for (const tx of validTxList) {
        let paymentType: PaymentType;
        if (tx.from === tx.to) {
        } else if (tx.from.toLowerCase() === receivingAddress.toLowerCase()) {
          paymentType = PaymentType.Out;
        } else {
          paymentType = PaymentType.In;
        }

        transferItems.push({
          id: tx.hash,
          mainAddress: receivingAddress,
          blockHash: tx.blockHash,
          blockNumber: tx.blockNumber,
          from: tx.from,
          to: tx.to,
          nonce: tx.nonce,
          value: tx.value,
          receivedAt: tx.timeStamp,
          paymentType,
          contractAddress: tx.contractAddress,
          tokenSymbol: tx.tokenSymbol,
          processStatus: ProcessStatus.Init,
          processAt: Date.now(),
          linkedTxHash: null,
        });
      }

      await db.ethereumERC20Transaction.createMany({
        data: transferItems,
      });
    } catch (reason) {
      console.error(reason);
    } finally {
      console.timeEnd(queryId);
      console.log('\n');
    }
  }

  private async getLastERC20TransactionFromDB(address: string) {
    const tx = await db.ethereumERC20Transaction.findFirst({
      where: { mainAddress: address },
      orderBy: [{ receivedAt: 'desc' }],
    });
    return {
      blockNumber: Number(tx?.blockNumber || 0),
      transactionHash: tx?.id || '',
    };
  }

  async processERC20Transaction() {
    // 待处理的转账订单
    const txs = await db.$transaction(async (db) => {
      const data = await db.ethereumERC20Transaction.findMany({
        where: {
          paymentType: PaymentType.In,
          processStatus: ProcessStatus.Init,
        },
      });
      if (data.length > 0) {
        await db.ethereumERC20Transaction.updateMany({
          where: { id: { in: data.map((x) => x.id) } },
          data: { processStatus: ProcessStatus.Pending, processAt: Date.now() },
        });
      }
      return data;
    });

    txs.forEach((tx) => {
      this.txQueue.add(GlobalConfig.queueConf.transferJobName, {
        id: tx.id,
        type: 'erc20',
        mainAddress: tx.mainAddress,
        processStatus: tx.processStatus,
      });
    });
    console.log(
      new Date(),
      `add ${txs.length} transactions to process queue.\n`,
    );
  }
}
