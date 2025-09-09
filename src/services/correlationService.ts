// Serviço para dados de correlação em tempo real (4 horas)
export interface CorrelationDataPoint {
  timestamp: number;
  date: string;
  btcPrice: number;
  sp500Price: number;
  btcReturn: number;
  sp500Return: number;
  correlation: number;
}

export interface CorrelationChartData {
  data: CorrelationDataPoint[];
  period: number;
  lastUpdate: Date;
}

export interface PairData {
  symbolA: string;
  symbolB: string;
  nameA: string;
  nameB: string;
  description: string;
  h1: number;
  h4: number;
  daily: number;
  weekly: number;
  zScore: number;
  signal: 'LONG' | 'SHORT' | '—';
}

export class CorrelationService {
  // Calcular correlação de Pearson
  static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Obter dados de correlação com período configurável
  static async getCorrelationData(period: number = 50): Promise<CorrelationChartData> {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Gerar dados mockados de 4 horas
      const mockData = this.generateMock4HData(period);
      
      // Calcular correlação para cada ponto
      const dataWithCorrelation: CorrelationDataPoint[] = mockData.map((point, index) => {
        // Calcular correlação usando os últimos 20 pontos
        const correlationWindow = Math.min(20, index + 1);
        const btcReturns = mockData.slice(0, index + 1).slice(-correlationWindow).map(p => p.btcReturn);
        const sp500Returns = mockData.slice(0, index + 1).slice(-correlationWindow).map(p => p.sp500Return);
        
        const correlation = this.calculatePearsonCorrelation(btcReturns, sp500Returns);
        
        return {
          timestamp: point.timestamp,
          date: point.date,
          btcPrice: point.btcPrice,
          sp500Price: point.sp500Price,
          btcReturn: point.btcReturn,
          sp500Return: point.sp500Return,
          correlation: isNaN(correlation) ? 0 : correlation
        };
      });

      return {
        data: dataWithCorrelation,
        period,
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error('Erro ao obter dados de correlação:', error);
      throw error;
    }
  }

  // Gerar dados mockados de 4 horas
  private static generateMock4HData(period: number): CorrelationDataPoint[] {
    const data: CorrelationDataPoint[] = [];
    const startTime = Date.now() - (period * 4 * 60 * 60 * 1000); // 4 horas atrás por período
    let btcPrice = 42000;
    let sp500Price = 4769.83;

    for (let i = 0; i < period; i++) {
      const timestamp = startTime + (i * 4 * 60 * 60 * 1000);
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      // Simular variações realistas
      const btcVariation = (Math.random() - 0.5) * 0.04; // ±2%
      const sp500Variation = (Math.random() - 0.5) * 0.02; // ±1%
      
      const newBtcPrice = btcPrice * (1 + btcVariation);
      const newSp500Price = sp500Price * (1 + sp500Variation);
      
      const btcReturn = ((newBtcPrice - btcPrice) / btcPrice) * 100;
      const sp500Return = ((newSp500Price - sp500Price) / sp500Price) * 100;
      
      data.push({
        timestamp,
        date,
        btcPrice: newBtcPrice,
        sp500Price: newSp500Price,
        btcReturn,
        sp500Return,
        correlation: 0 // Será calculado depois
      });
      
      btcPrice = newBtcPrice;
      sp500Price = newSp500Price;
    }

    return data;
  }

  // Calcular dados do par para CorrelationPairsPage
  static async calculatePairData(
    symbolA: string,
    symbolB: string,
    nameA: string,
    nameB: string,
    dataA: any,
    dataB: any,
    zThreshold: number,
    description: string
  ): Promise<PairData> {
    try {
      // Simular cálculo de correlação para diferentes timeframes
      const h1 = Math.random() * 0.8; // 0-80%
      const h4 = Math.random() * 0.8;
      const daily = Math.random() * 0.8;
      const weekly = Math.random() * 0.8;
      
      // Calcular Z-Score simulado
      const zScore = (Math.random() - 0.5) * 4; // -2 a +2
      
      // Determinar sinal baseado no Z-Score
      let signal: 'LONG' | 'SHORT' | '—' = '—';
      if (Math.abs(zScore) >= zThreshold) {
        signal = zScore > 0 ? 'LONG' : 'SHORT';
      }

      return {
        symbolA,
        symbolB,
        nameA,
        nameB,
        description,
        h1,
        h4,
        daily,
        weekly,
        zScore,
        signal
      };
    } catch (error) {
      console.error('Erro ao calcular dados do par:', error);
      throw error;
    }
  }
}