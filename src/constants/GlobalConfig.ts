export const GlobalConfig = {
  jsonLimit: '1mb',

  feeRate: 0.1, // 费率

  queueConf: {
    prefix: 'mnt:',
    txQueueName: 'tx-queue',
    transferJobName: 'transfer-job',
  },

  MAX_USDT_AMOUNT: 10, // 最大转账金额

  chainConf: {
    Goerli: {
      USDT: {
        contractAddress: '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49',
      },
    },
    Mainnet: {
      USDT: {
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      },
      USDC: {
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      },
    },
  },
};
