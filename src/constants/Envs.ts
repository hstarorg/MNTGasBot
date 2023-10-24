function getEnv(name: string) {
  return process.env[name];
}

export const Envs = {
  get APP_SECRET(): string {
    return getEnv('APP_SECRET') || '';
  },

  get GasBot_BOTS(): string {
    return getEnv('GasBot_BOTS');
  },

  get PAYMENT_ACCOUNT() {
    const [privateKey, address] = (getEnv('PAYMENT_ACCOUNT') || '').split('|');
    return { privateKey, address };
  },

  get RECEIVING_ADDRESS() {
    return getEnv('RECEIVING_ADDRESS') || '';
  },

  get ETHERSCAN_APIKEY(): string {
    return getEnv('ETHERSCAN_APIKEY') || '';
  },

  get REDIS_URL(): string {
    return getEnv('REDIS_URL') || '';
  },

  get APP_ENV(): 'test' | 'prod' {
    return getEnv('APP_ENV') === 'prod' ? 'prod' : 'test';
  },

  get COINMARKETCAP_API_KEY(): string {
    return getEnv('COINMARKETCAP_API_KEY');
  },
};
