import axios from 'axios';

export interface KlineData {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteAssetVolume: number;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
}

export interface PriceData {
  timestamp: number;
  price: number;
}

class BinanceService {
  private baseUrl = 'https://api.binance.com/api/v3';

  /**
   * Busca dados de klines (candlesticks) da Binance
   */
  async getKlines(symbol: string, interval: string, limit: number = 500): Promise<PriceData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: {
          symbol: symbol.toUpperCase(),
          interval,
          limit
        }
      });

      return response.data.map((kline: any) => ({
        timestamp: kline[0],
        price: parseFloat(kline[4]) // Preço de fechamento
      }));
    } catch (error) {
      console.error(`Erro ao buscar dados para ${symbol}:`, error);
      throw new Error(`Falha ao buscar dados para ${symbol}`);
    }
  }

  /**
   * Busca dados para diferentes timeframes
   */
  async getMultiTimeframeData(symbol: string, days: number = 30): Promise<{
    '1h': PriceData[];
    '4h': PriceData[];
    '1d': PriceData[];
    '1w': PriceData[];
  }> {
    const intervals = {
      '1h': '1h',
      '4h': '4h', 
      '1d': '1d',
      '1w': '1w'
    };

    const limits = {
      '1h': Math.min(days * 24, 1000),
      '4h': Math.min(days * 6, 500),
      '1d': Math.min(days, 500),
      '1w': Math.min(Math.ceil(days / 7), 200)
    };

    const results = await Promise.all(
      Object.entries(intervals).map(async ([key, interval]) => {
        try {
          const data = await this.getKlines(symbol, interval, limits[key as keyof typeof limits]);
          return [key, data] as [string, PriceData[]];
        } catch (error) {
          console.warn(`Erro ao buscar dados ${interval} para ${symbol}:`, error);
          return [key, []] as [string, PriceData[]];
        }
      })
    );

    return Object.fromEntries(results);
  }

  /**
   * Busca preço atual de um símbolo
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol: symbol.toUpperCase() }
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error(`Erro ao buscar preço atual para ${symbol}:`, error);
      throw new Error(`Falha ao buscar preço atual para ${symbol}`);
    }
  }

  /**
   * Verifica se um símbolo existe na Binance
   */
  async symbolExists(symbol: string): Promise<boolean> {
    try {
      await this.getCurrentPrice(symbol);
      return true;
    } catch {
      return false;
    }
  }
}

export const binanceService = new BinanceService();
