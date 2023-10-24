import { Injectable } from '@nestjs/common';

import { MantleKit, MantleNetwork } from '../libs';
import { Envs } from '../constants';
import { db } from '../utils';
import { ProcessStatus } from '../types/transaction';

@Injectable()
export class MantleService {
  private readonly mantleKit: MantleKit;
  constructor() {
    const account = Envs.PAYMENT_ACCOUNT;
    const network =
      Envs.APP_ENV === 'test'
        ? MantleNetwork.MantleTestnet
        : MantleNetwork.MantleMainnet;

    this.mantleKit = new MantleKit({
      network,
      walletPrimaryKey: account.privateKey,
    });

    console.log(
      `Init mantleKit with network = ${network}, wallet address =${account.address}`,
    );
  }

  async sendTransactionAndGetToBalance(toAddress: string, mntAmount: string) {
    await this.mantleKit.sendTransaction(toAddress, mntAmount);
    return await this.mantleKit.getWalletBalance(toAddress);
  }

  async getMantlePrice() {
    return await MantleKit.getMantlePrice();
  }

  async getGasTransaction(
    ethereumTxId: string,
  ): Promise<{ status: 'none' | 'pending' | 'done'; mantleTxHash?: string }> {
    const tx = await db.ethereumERC20Transaction.findUnique({
      where: { id: ethereumTxId },
    });
    if (!tx) {
      return { status: 'none' };
    }
    if (tx.processStatus === ProcessStatus.Done) {
      return {
        status: 'done',
        mantleTxHash: tx.linkedTxHash,
      };
    }
    return { status: 'pending' };
  }
}
