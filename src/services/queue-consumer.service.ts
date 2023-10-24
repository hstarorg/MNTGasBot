import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Envs, GlobalConfig } from '../constants';
import { db, numberDiv, numberMul } from '../utils';
import { ProcessStatus } from '../types/transaction';
import { MantleKit, MantleNetwork } from '../libs/MantleKit';
import { BadRequestException } from '@nestjs/common';

@Processor(GlobalConfig.queueConf.txQueueName)
export class QueueConsumerService {
  @Process(GlobalConfig.queueConf.transferJobName)
  async handleTransfer(
    job: Job<{
      id: string;
      mainAddress: string;
      processStatus: string;
      type: string;
    }>,
  ) {
    console.log('start job', job.id, job.data);

    // 异常 Job，去掉
    if (!job.data?.id) {
      console.log('invalid job');
      return { success: true, message: 'invalid job' };
    }
    if (job.data?.type !== 'erc20') {
      console.log('invalid job type');
    }
    // 查询待处理的交易
    const tx = await db.$transaction(async (db) => {
      const data = await db.ethereumERC20Transaction.findUnique({
        where: {
          id: job.data.id,
          processStatus: ProcessStatus.Pending,
        },
      });
      if (!data) {
        return null;
      }
      db.ethereumERC20Transaction.update({
        where: { id: data.id },
        data: {
          processStatus: ProcessStatus.Processing,
          processAt: Date.now(),
        },
      });
      return data;
    });

    // 交易不存在，或者已经处理过了
    if (!tx) {
      console.log('tx not found or processed');
      return { success: true, message: 'tx not found or processed' };
    }

    // 计算 USDT 金额
    const usdtValue = Number(numberDiv(tx.value, 10 ** 6));

    if (usdtValue > GlobalConfig.MAX_USDT_AMOUNT) {
      console.log('tx value too large');
      throw new BadRequestException('tx value too large');
    }

    const priceResult = await MantleKit.getMantlePrice();

    const mntAmount = numberDiv(
      numberMul(usdtValue, 1 - GlobalConfig.feeRate),
      priceResult.mntPrice,
    );
    console.log(
      `USDT = ${usdtValue}, MNT Price = ${priceResult.mntPrice}, MNT Amount = ${mntAmount}`,
    );

    // 处理交易
    console.time('transfer');
    const transferResult = await MantleKit.sendTransaction(
      Envs.APP_ENV === 'prod'
        ? MantleNetwork.MantleMainnet
        : MantleNetwork.MantleTestnet,
      Envs.PAYMENT_ACCOUNT.privateKey,
      tx.from,
      mntAmount,
    );
    console.timeEnd('transfer');

    // 更新交易状态
    await db.ethereumERC20Transaction.update({
      where: { id: tx.id },
      data: {
        processStatus: ProcessStatus.Done,
        processAt: Date.now(),
        linkedTxHash: transferResult.hash,
      },
    });

    console.log('transfer ok');
    return { success: true, message: 'transfer ok' };
  }
}
