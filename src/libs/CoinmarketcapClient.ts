import axios, { AxiosInstance } from 'axios';

export class CoinmarketcapClient {
  private httpClient: AxiosInstance;
  private readonly apiKey: string;
  constructor(options: { apiKey: string; timeout?: number }) {
    this.apiKey = options.apiKey;
    this.httpClient = axios.create({
      baseURL: 'https://pro-api.coinmarketcap.com',
      timeout: options?.timeout ?? 3000,
    });
  }

  async getCryptoCurrency(symbol: string[]) {
    return this.httpClient
      .get('/v2/cryptocurrency/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
        },
        params: {
          symbol: symbol.join(','),
        },
      })
      .then((res) => {
        const data = res.data;
        if (data.data) {
          const result: Record<string, any[]> = {};
          Object.keys(data.data).forEach((key) => {
            const items = data.data[key];
            result[key] = items.map((x) => ({
              id: x.id,
              name: x.name,
              symbol: x.symbol,
              slug: x.slug,
              date_added: x.date_added,
              last_updated: x.last_updated,
              usdPrice: x.quote.USD.price,
            }));
          });
          return result;
        }
        return Promise.reject(data);
      });
  }
}
