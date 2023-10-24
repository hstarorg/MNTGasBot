import {
  TransactionRequest,
  Wallet,
  parseEther,
  JsonRpcProvider,
  formatEther,
} from 'ethers';
import { CoinmarketcapClient } from './CoinmarketcapClient';
import { Envs } from '../constants';

export enum MantleNetwork {
  MantleMainnet = 'https://rpc.mantle.xyz',
  MantleTestnet = 'https://rpc.testnet.mantle.xyz',
}

const PRICE_CACHE: {
  mntPrice: string;
  ethPrice: string;
  queryDate: number;
} = {
  mntPrice: '--',
  ethPrice: '--',
  queryDate: 0,
};

const ONE_HOUR_MS = 1000 * 60 * 60;

let cmcClient: CoinmarketcapClient;

function getPrice(data: any, filter: (x: any) => boolean) {
  return data.find(filter)?.usdPrice || '--';
}

export class MantleKit {
  constructor(
    private options: { network: MantleNetwork; walletPrimaryKey: string },
  ) {}

  private static get cmcClient() {
    if (!cmcClient) {
      cmcClient = new CoinmarketcapClient({
        apiKey: Envs.COINMARKETCAP_API_KEY,
      });
    }
    return cmcClient;
  }

  static async getMantlePrice() {
    const now = Date.now();
    if (now - PRICE_CACHE.queryDate > ONE_HOUR_MS) {
      const data = await this.cmcClient.getCryptoCurrency(['MNT', 'ETH']);
      const mntPrice = getPrice(
        data.MNT,
        (x) => x.slug === 'mantle' && x.name === 'Mantle',
      );
      const ethPrice = getPrice(
        data.ETH,
        (x) => x.slug === 'ethereum' && x.name === 'Ethereum',
      );
      PRICE_CACHE.mntPrice = mntPrice;
      PRICE_CACHE.ethPrice = ethPrice;
      PRICE_CACHE.queryDate = now;
    }
    return PRICE_CACHE;
  }

  /**
   * 查询钱包余额
   * @param network
   * @param address
   * @returns
   */
  static async getWalletBalance(network: MantleNetwork, address: string) {
    // 1. 构建钱包
    const l2RpcProvider = new JsonRpcProvider(network);
    const balance = await l2RpcProvider.getBalance(address);
    return {
      balance,
      formatedBalance: formatEther(balance),
    };
  }

  async getWalletBalance(address: string) {
    return MantleKit.getWalletBalance(this.options.network, address);
  }

  /**
   * 发送交易
   * @param toAddress 接收人地址
   * @param mntAmount MNT 数量
   */
  static async sendTransaction(
    network: MantleNetwork,
    walletPrimaryKey: string,
    toAddress: string,
    mntAmount: string,
  ) {
    // 1. 构建钱包
    const l2RpcProvider = new JsonRpcProvider(network);
    const wallet = new Wallet(walletPrimaryKey, l2RpcProvider);

    // 2. 创建交易
    const tx: TransactionRequest = {
      to: toAddress,
      value: parseEther(mntAmount),
    };

    // 3. 发送交易
    const txRes = await wallet.sendTransaction(tx);
    // 3.1 等待链上确认交易
    await txRes.wait();
    // 3.2 返回结果
    return txRes as {
      hash: string;
      to: string;
      from: string;
      nonce: number;
      value: bigint;
    };
  }

  async sendTransaction(toAddress: string, mntAmount: string) {
    return MantleKit.sendTransaction(
      this.options.network,
      this.options.walletPrimaryKey,
      toAddress,
      mntAmount,
    );
  }
}
