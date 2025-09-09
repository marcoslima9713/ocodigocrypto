// Serviço para cálculo de hedge ratio BTC/ETH
export interface HedgeData {
  date: string;
  btcPrice: number;
  ethPrice: number;
  btcReturn: number;
  ethReturn: number;
}

export interface HedgeRatio {
  beta: number;
  rSquared: number;
  correlation: number;
  lastUpdate: string;
}

export interface HedgePosition {
  btcPosition: number;
  ethPosition: number;
  hedgeRatio: number;
  totalValue: number;
}

export class HedgeService {
  private static instance: HedgeService;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  static getInstance(): HedgeService {
    if (!HedgeService.instance) {
      HedgeService.instance = new HedgeService();
    }
    return HedgeService.instance;
  }

  // Buscar dados históricos de preços BTC e ETH
  async getHistoricalData(days: number = 30): Promise<HedgeData[]> {
    const cacheKey = `historical_data_${days}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Buscar dados reais da Binance API
      const { binanceService } = await import('@/services/binanceService');
      
      // Buscar dados históricos para BTC e ETH
      const [btcData, ethData] = await Promise.all([
        binanceService.getMultiTimeframeData('BTCUSDT', days),
        binanceService.getMultiTimeframeData('ETHUSDT', days)
      ]);

      // Processar dados diários (usar dados diários para consistência)
      const dailyData = btcData.daily || [];
      const ethDailyData = ethData.daily || [];
      
      const data: HedgeData[] = [];
      
      // Combinar dados BTC e ETH
      for (let i = 0; i < Math.min(dailyData.length, ethDailyData.length); i++) {
        const btcPoint = dailyData[i];
        const ethPoint = ethDailyData[i];
        
        if (btcPoint && ethPoint && btcPoint.close && ethPoint.close) {
          data.push({
            date: new Date(btcPoint.timestamp).toISOString().split('T')[0],
            btcPrice: parseFloat(btcPoint.close),
            ethPrice: parseFloat(ethPoint.close),
            btcReturn: 0,
            ethReturn: 0
          });
        }
      }

      // Calcular retornos percentuais
      for (let i = 1; i < data.length; i++) {
        data[i].btcReturn = ((data[i].btcPrice - data[i-1].btcPrice) / data[i-1].btcPrice) * 100;
        data[i].ethReturn = ((data[i].ethPrice - data[i-1].ethPrice) / data[i-1].ethPrice) * 100;
      }

      this.setCached(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      return [];
    }
  }

  // Calcular hedge ratio usando regressão linear
  calculateHedgeRatio(data: HedgeData[]): HedgeRatio {
    if (data.length < 2) {
      return { beta: 0, rSquared: 0, correlation: 0, lastUpdate: new Date().toISOString() };
    }

    // Filtrar dados válidos (com retornos calculados)
    const validData = data.filter(d => !isNaN(d.btcReturn) && !isNaN(d.ethReturn));
    
    if (validData.length < 2) {
      return { beta: 0, rSquared: 0, correlation: 0, lastUpdate: new Date().toISOString() };
    }

    // Calcular médias
    const btcReturns = validData.map(d => d.btcReturn);
    const ethReturns = validData.map(d => d.ethReturn);
    
    const btcMean = btcReturns.reduce((sum, val) => sum + val, 0) / btcReturns.length;
    const ethMean = ethReturns.reduce((sum, val) => sum + val, 0) / ethReturns.length;

    // Calcular covariância e variância
    let covariance = 0;
    let btcVariance = 0;
    let ethVariance = 0;

    for (let i = 0; i < validData.length; i++) {
      const btcDiff = btcReturns[i] - btcMean;
      const ethDiff = ethReturns[i] - ethMean;
      
      covariance += btcDiff * ethDiff;
      btcVariance += btcDiff * btcDiff;
      ethVariance += ethDiff * ethDiff;
    }

    // Calcular beta (coeficiente angular)
    const beta = btcVariance !== 0 ? covariance / btcVariance : 0;

    // Calcular correlação
    const correlation = Math.sqrt(btcVariance) * Math.sqrt(ethVariance) !== 0 
      ? covariance / (Math.sqrt(btcVariance) * Math.sqrt(ethVariance))
      : 0;

    // Calcular R²
    const rSquared = correlation * correlation;

    return {
      beta: Math.abs(beta), // Usar valor absoluto para hedge
      rSquared: Math.abs(rSquared),
      correlation: Math.abs(correlation),
      lastUpdate: new Date().toISOString()
    };
  }

  // Calcular posição hedge
  calculateHedgePosition(btcPosition: number, hedgeRatio: HedgeRatio): HedgePosition {
    const ethPosition = btcPosition * hedgeRatio.beta;
    const totalValue = btcPosition + ethPosition;

    return {
      btcPosition,
      ethPosition,
      hedgeRatio: hedgeRatio.beta,
      totalValue
    };
  }

  // Gerar dados para planilha
  async generateSpreadsheetData(): Promise<{
    hedgeData: HedgeData[];
    hedgeRatio: HedgeRatio;
    recommendations: string[];
  }> {
    const data = await this.getHistoricalData(30);
    const ratio = this.calculateHedgeRatio(data);
    
    const recommendations = [
      `Hedge Ratio (β): ${ratio.beta.toFixed(3)} - Para cada $1.000 em BTC, shorte $${(ratio.beta * 1000).toFixed(0)} em ETH`,
      `Correlação: ${(ratio.correlation * 100).toFixed(1)}% - ${ratio.correlation > 0.7 ? 'Alta correlação' : ratio.correlation > 0.4 ? 'Correlação moderada' : 'Baixa correlação'}`,
      `R²: ${(ratio.rSquared * 100).toFixed(1)}% - ${ratio.rSquared > 0.5 ? 'Modelo confiável' : 'Modelo com baixa confiabilidade'}`,
      `Última atualização: ${new Date(ratio.lastUpdate).toLocaleString('pt-BR')}`,
      'Nota: Este hedge ratio busca neutralizar a exposição direcional. A cada rebalanceamento, use o valor de β para dimensionar a posição no ETH em relação ao BTC.'
    ];

    return {
      hedgeData: data,
      hedgeRatio: ratio,
      recommendations
    };
  }

  // Calcular hedge para todos os pares ativos
  async calculateHedgeForAllPairs(pairsData: any[]): Promise<{
    pairHedges: Array<{
      pair: string;
      hedgeRatio: number;
      correlation: number;
      rSquared: number;
      recommendation: string;
    }>;
    overallHedge: HedgeRatio;
  }> {
    try {
      const { binanceService } = await import('@/services/binanceService');
      
      const pairHedges = await Promise.all(
        pairsData.map(async (pair) => {
          try {
            // Buscar dados históricos para o par
            const [dataA, dataB] = await Promise.all([
              binanceService.getMultiTimeframeData(pair.symbolA, 30),
              binanceService.getMultiTimeframeData(pair.symbolB, 30)
            ]);

            // Processar dados diários
            const dailyDataA = dataA.daily || [];
            const dailyDataB = dataB.daily || [];
            
            const hedgeData: HedgeData[] = [];
            
            // Combinar dados dos dois ativos
            for (let i = 0; i < Math.min(dailyDataA.length, dailyDataB.length); i++) {
              const pointA = dailyDataA[i];
              const pointB = dailyDataB[i];
              
              if (pointA && pointB && pointA.close && pointB.close) {
                hedgeData.push({
                  date: new Date(pointA.timestamp).toISOString().split('T')[0],
                  btcPrice: parseFloat(pointA.close),
                  ethPrice: parseFloat(pointB.close),
                  btcReturn: 0,
                  ethReturn: 0
                });
              }
            }

            // Calcular retornos
            for (let i = 1; i < hedgeData.length; i++) {
              hedgeData[i].btcReturn = ((hedgeData[i].btcPrice - hedgeData[i-1].btcPrice) / hedgeData[i-1].btcPrice) * 100;
              hedgeData[i].ethReturn = ((hedgeData[i].ethPrice - hedgeData[i-1].ethPrice) / hedgeData[i-1].ethPrice) * 100;
            }

            // Calcular hedge ratio
            const hedgeRatio = this.calculateHedgeRatio(hedgeData);
            
            return {
              pair: `${pair.nameA}/${pair.nameB}`,
              hedgeRatio: hedgeRatio.beta,
              correlation: hedgeRatio.correlation,
              rSquared: hedgeRatio.rSquared,
              recommendation: `Para cada $1.000 em ${pair.nameA}, shorte $${(hedgeRatio.beta * 1000).toFixed(0)} em ${pair.nameB}`
            };
          } catch (error) {
            console.warn(`Erro ao calcular hedge para ${pair.symbolA}/${pair.symbolB}:`, error);
            return {
              pair: `${pair.nameA}/${pair.nameB}`,
              hedgeRatio: 0,
              correlation: 0,
              rSquared: 0,
              recommendation: 'Erro no cálculo'
            };
          }
        })
      );

      // Calcular hedge geral (BTC/ETH)
      const overallData = await this.getHistoricalData(30);
      const overallHedge = this.calculateHedgeRatio(overallData);

      return {
        pairHedges: pairHedges.filter(h => h.hedgeRatio > 0),
        overallHedge
      };
    } catch (error) {
      console.error('Erro ao calcular hedge para todos os pares:', error);
      return {
        pairHedges: [],
        overallHedge: { beta: 0, rSquared: 0, correlation: 0, lastUpdate: new Date().toISOString() }
      };
    }
  }

  // Cache helper methods
  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const hedgeService = HedgeService.getInstance();
