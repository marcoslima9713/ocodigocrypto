import axios from 'axios';

export interface FundingRateData {
  symbol: string;
  fundingRate: number;
  fundingTime: number;
  nextFundingTime: number;
  markPrice: number;
  indexPrice: number;
  lastFundingRate: number;
  exchange: string;
}

export interface ArbitrageOpportunity {
  symbol: string;
  spotPrice: number;
  futuresPrice: number;
  fundingRate: number;
  annualizedReturn: number;
  dailyReturn: number;
  monthlyReturn: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  exchange: string;
  timestamp: number;
}

export interface PositionSimulation {
  capital: number;
  btcAmount: number;
  dailyReturn: number;
  monthlyReturn: number;
  annualReturn: number;
  roi: number;
  fundingRate: number;
  risk: string;
}

class FundingRateService {
  private binanceUrl = 'https://fapi.binance.com/fapi/v1';

  /**
   * Busca funding rates da Binance
   */
  async getBinanceFundingRates(): Promise<FundingRateData[]> {
    try {
      const response = await axios.get(`${this.binanceUrl}/fundingRate`);
      
      return response.data.map((item: any) => ({
        symbol: item.symbol,
        fundingRate: parseFloat(item.fundingRate),
        fundingTime: item.fundingTime,
        nextFundingTime: item.nextFundingTime,
        markPrice: parseFloat(item.markPrice),
        indexPrice: parseFloat(item.indexPrice),
        lastFundingRate: parseFloat(item.lastFundingRate),
        exchange: 'Binance'
      }));
    } catch (error) {
      console.error('Erro ao buscar funding rates da Binance:', error);
      return [];
    }
  }

  /**
   * Busca todos os funding rates (apenas Binance)
   */
  async getAllFundingRates(): Promise<FundingRateData[]> {
    try {
      const binanceRates = await this.getBinanceFundingRates();
      return binanceRates;
    } catch (error) {
      console.error('Erro ao buscar funding rates:', error);
      return [];
    }
  }

  /**
   * Identifica oportunidades de arbitragem
   */
  async getArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
    try {
      const fundingRates = await this.getAllFundingRates();
      const opportunities: ArbitrageOpportunity[] = [];

      // Filtra apenas BTC e ETH para simplicidade
      const targetSymbols = ['BTCUSDT', 'ETHUSDT'];
      
      for (const rate of fundingRates) {
        if (targetSymbols.includes(rate.symbol)) {
          const annualizedReturn = rate.fundingRate * 3 * 365; // 3x por dia * 365 dias
          const dailyReturn = rate.fundingRate * 3; // 3x por dia
          const monthlyReturn = dailyReturn * 30;

          let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          if (Math.abs(rate.fundingRate) > 0.01) risk = 'HIGH';
          else if (Math.abs(rate.fundingRate) > 0.005) risk = 'MEDIUM';

          opportunities.push({
            symbol: rate.symbol,
            spotPrice: rate.indexPrice,
            futuresPrice: rate.markPrice,
            fundingRate: rate.fundingRate,
            annualizedReturn,
            dailyReturn,
            monthlyReturn,
            risk,
            exchange: rate.exchange,
            timestamp: Date.now()
          });
        }
      }

      return opportunities.sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));
    } catch (error) {
      console.error('Erro ao calcular oportunidades de arbitragem:', error);
      return [];
    }
  }

  /**
   * Simula uma posição de arbitragem
   */
  calculatePositionSimulation(
    capital: number,
    fundingRate: number,
    leverage: number = 1
  ): PositionSimulation {
    const btcAmount = capital / 40000; // Preço aproximado do BTC
    const dailyReturn = capital * fundingRate * 3; // 3x por dia
    const monthlyReturn = dailyReturn * 30;
    const annualReturn = dailyReturn * 365;
    const roi = (annualReturn / capital) * 100;

    let risk = 'LOW';
    if (Math.abs(fundingRate) > 0.01) risk = 'HIGH';
    else if (Math.abs(fundingRate) > 0.005) risk = 'MEDIUM';

    return {
      capital,
      btcAmount,
      dailyReturn,
      monthlyReturn,
      annualReturn,
      roi,
      fundingRate,
      risk
    };
  }

  /**
   * Busca dados históricos de funding rate
   */
  async getHistoricalFundingRates(symbol: string, days: number = 30): Promise<FundingRateData[]> {
    try {
      const response = await axios.get(`${this.binanceUrl}/fundingRate`, {
        params: {
          symbol: symbol,
          limit: days * 3 // 3 funding rates por dia
        }
      });
      
      return response.data.map((item: any) => ({
        symbol: item.symbol,
        fundingRate: parseFloat(item.fundingRate),
        fundingTime: item.fundingTime,
        nextFundingTime: item.nextFundingTime,
        markPrice: parseFloat(item.markPrice),
        indexPrice: parseFloat(item.indexPrice),
        lastFundingRate: parseFloat(item.lastFundingRate),
        exchange: 'Binance'
      }));
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      return [];
    }
  }

  /**
   * Busca preços atuais dos ativos
   */
  async getCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
    try {
      const response = await axios.get(`${this.binanceUrl}/ticker/price`);
      const prices: Record<string, number> = {};
      
      response.data.forEach((item: any) => {
        if (symbols.includes(item.symbol)) {
          prices[item.symbol] = parseFloat(item.price);
        }
      });
      
      return prices;
    } catch (error) {
      console.error('Erro ao buscar preços atuais:', error);
      return {};
    }
  }

  /**
   * Calcula estatísticas de funding rate
   */
  calculateFundingRateStats(fundingRates: FundingRateData[]) {
    const btcRates = fundingRates.filter(rate => rate.symbol === 'BTCUSDT');
    const ethRates = fundingRates.filter(rate => rate.symbol === 'ETHUSDT');

    const btcAvg = btcRates.length > 0 
      ? btcRates.reduce((acc, rate) => acc + rate.fundingRate, 0) / btcRates.length 
      : 0;

    const ethAvg = ethRates.length > 0 
      ? ethRates.reduce((acc, rate) => acc + rate.fundingRate, 0) / ethRates.length 
      : 0;

    return {
      btcAverage: btcAvg,
      ethAverage: ethAvg,
      btcCount: btcRates.length,
      ethCount: ethRates.length,
      totalCount: fundingRates.length
    };
  }
}

export const fundingRateService = new FundingRateService();
