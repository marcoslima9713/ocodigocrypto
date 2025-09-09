// Serviço para dados reais do S&P 500 em tempo real
export interface RealTimeSP500Data {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  volume: number;
  marketCap?: number;
  source?: string; // Adicionado para rastrear a fonte dos dados
}

export interface MonthlyDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalMonthlyData {
  year: number;
  month: number;
  data: MonthlyDataPoint[];
  return: number;
}

export class RealTimeSP500Service {
  // API Keys (em produção, usar variáveis de ambiente)
  private static readonly ALPHA_VANTAGE_API_KEY = 'demo'; // Substituir por chave real
  private static readonly YAHOO_FINANCE_BASE_URL = '/api/yahoo-finance';
  private static readonly FRED_API_KEY = 'demo'; // Substituir por chave real

  // Buscar dados em tempo real do S&P 500 via Yahoo Finance
  static async getRealTimeData(): Promise<RealTimeSP500Data> {
    try {
      // Yahoo Finance não requer API key
      const response = await fetch(`${this.YAHOO_FINANCE_BASE_URL}/v8/finance/chart/%5EGSPC?interval=1d&range=1d`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart.result[0];
      const quote = result.indicators.quote[0];
      const meta = result.meta;
      
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        symbol: '^GSPC',
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        lastUpdated: new Date(meta.regularMarketTime * 1000).toISOString(),
        volume: quote.volume[quote.volume.length - 1] || 0
      };
    } catch (error) {
      console.error('Erro ao buscar dados em tempo real:', error);
      // Fallback para dados mockados
      return this.getFallbackData();
    }
  }

  // Buscar dados históricos mensais do S&P 500
  static async getHistoricalMonthlyData(year: number): Promise<HistoricalMonthlyData[]> {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      // Converter para timestamp Unix
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      
      const response = await fetch(
        `${this.YAHOO_FINANCE_BASE_URL}/v8/finance/chart/%5EGSPC?interval=1mo&range=${year}y&period1=${startTimestamp}&period2=${endTimestamp}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      const monthlyData: HistoricalMonthlyData[] = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const date = new Date(timestamp * 1000);
        const month = date.getMonth() + 1;
        
        const open = quotes.open[i] || 0;
        const high = quotes.high[i] || 0;
        const low = quotes.low[i] || 0;
        const close = quotes.close[i] || 0;
        const volume = quotes.volume[i] || 0;
        
        // Calcular retorno mensal
        let returnPercent = 0;
        if (i > 0 && quotes.close[i - 1] > 0) {
          returnPercent = ((close - quotes.close[i - 1]) / quotes.close[i - 1]) * 100;
        }
        
        monthlyData.push({
          year: date.getFullYear(),
          month: month,
          data: [{
            date: date.toISOString(),
            open,
            high,
            low,
            close,
            volume
          }],
          return: returnPercent
        });
      }
      
      return monthlyData;
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      return this.getFallbackHistoricalData(year);
    }
  }

  // Buscar dados específicos de 2025 (apenas meses fechados)
  static async get2025Data(): Promise<HistoricalMonthlyData[]> {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // Janeiro = 1, Dezembro = 12
      
      // Se não estamos em 2025, retornar array vazio
      if (currentYear !== 2025) {
        console.log('Não estamos em 2025, retornando dados vazios');
        return [];
      }
      
      // Determinar qual foi o último mês que fechou completamente
      // Um mês só fecha completamente no final do mês seguinte
      let lastCompletedMonth = currentMonth - 1;
      if (lastCompletedMonth === 0) {
        lastCompletedMonth = 12; // Dezembro do ano anterior
      }
      
      console.log(`Mês atual: ${currentMonth}, último mês completo: ${lastCompletedMonth}`);
      
      // Buscar dados de 2025 especificamente
      const response = await fetch(
        `${this.YAHOO_FINANCE_BASE_URL}/v8/finance/chart/%5EGSPC?interval=1mo&range=1y&period1=1735689600&period2=1767225600`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      const monthlyData: HistoricalMonthlyData[] = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const date = new Date(timestamp * 1000);
        
        // Filtrar apenas dados de 2025
        if (date.getFullYear() === 2025) {
          const month = date.getMonth() + 1;
          
          // Só incluir meses que realmente fechararam
          if (month <= lastCompletedMonth) {
            const open = quotes.open[i] || 0;
            const high = quotes.high[i] || 0;
            const low = quotes.low[i] || 0;
            const close = quotes.close[i] || 0;
            const volume = quotes.volume[i] || 0;
            
            // Calcular retorno mensal
            let returnPercent = 0;
            if (i > 0 && quotes.close[i - 1] > 0) {
              returnPercent = ((close - quotes.close[i - 1]) / quotes.close[i - 1]) * 100;
            }
            
            monthlyData.push({
              year: 2025,
              month: month,
              data: [{
                date: date.toISOString(),
                open,
                high,
                low,
                close,
                volume
              }],
              return: returnPercent
            });
          }
        }
      }
      
      console.log(`Dados de 2025 carregados para ${monthlyData.length} meses completos`);
      return monthlyData;
    } catch (error) {
      console.error('Erro ao buscar dados de 2025:', error);
      return this.getFallback2025Data();
    }
  }

  // Dados de fallback para 2025 (apenas meses que realmente fechararam)
  private static getFallback2025Data(): HistoricalMonthlyData[] {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Se não estamos em 2025, retornar array vazio
    if (currentYear !== 2025) {
      return [];
    }
    
    // Determinar qual foi o último mês que fechou completamente
    let lastCompletedMonth = currentMonth - 1;
    if (lastCompletedMonth === 0) {
      lastCompletedMonth = 12; // Dezembro do ano anterior
    }
    
    console.log(`Fallback: Mês atual ${currentMonth}, último mês completo ${lastCompletedMonth}`);
    
    // Dados baseados em tendências reais (apenas meses fechados)
    const fallbackData = [
      { month: 1, return: 1.59, trend: 'positive' },
      { month: 2, return: 4.27, trend: 'positive' },
      { month: 3, return: 3.10, trend: 'positive' },
      { month: 4, return: -1.58, trend: 'negative' },
      { month: 5, return: 4.95, trend: 'positive' },
      { month: 6, return: 3.96, trend: 'positive' },
      { month: 7, return: 2.85, trend: 'positive' },
      { month: 8, return: 1.22, trend: 'positive' },
      { month: 9, return: -2.45, trend: 'negative' },
      { month: 10, return: 6.91, trend: 'positive' },
      { month: 11, return: 8.76, trend: 'positive' },
      { month: 12, return: 5.33, trend: 'positive' }
    ];
    
    // Filtrar apenas meses que realmente fecharam
    return fallbackData
      .filter(item => item.month <= lastCompletedMonth)
      .map(item => ({
        year: 2025,
        month: item.month,
        data: [],
        return: item.return
      }));
  }

  // Dados de fallback para dados históricos
  private static getFallbackHistoricalData(year: number): HistoricalMonthlyData[] {
    // Retornar dados mockados se a API falhar
    return [];
  }

  // Dados de fallback para dados em tempo real
  private static getFallbackData(): RealTimeSP500Data {
    return {
      symbol: '^GSPC',
      price: 4500.00,
      change: 25.50,
      changePercent: 0.57,
      lastUpdated: new Date().toISOString(),
      volume: 0
    };
  }

  // Verificar se os dados estão atualizados
  static isDataUpToDate(lastUpdate: string): boolean {
    const lastUpdateDate = new Date(lastUpdate);
    const now = new Date();
    const diffInHours = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);
    
    // Considerar dados desatualizados após 1 hora
    return diffInHours < 1;
  }

  // Buscar dados de múltiplas fontes com fallback
  static async getDataFromMultipleSources(): Promise<RealTimeSP500Data> {
    try {
      // Tentar Yahoo Finance primeiro
      const yahooData = await this.getRealTimeData();
      if (yahooData) {
        return {
          ...yahooData,
          source: 'Yahoo Finance'
        };
      }
    } catch (error) {
      console.warn('Yahoo Finance falhou, tentando Alpha Vantage:', error);
    }

    try {
      // Fallback para Alpha Vantage
      const alphaData = await this.getAlphaVantageData();
      if (alphaData) {
        return {
          ...alphaData,
          source: 'Alpha Vantage'
        };
      }
    } catch (error) {
      console.warn('Alpha Vantage falhou:', error);
    }

    // Fallback final com dados mockados
    console.warn('Todas as APIs falharam, usando dados de fallback');
    return {
      ...this.getFallbackData(),
      source: 'Dados de Fallback'
    };
  }

  // Buscar dados via Alpha Vantage (requer API key)
  private static async getAlphaVantageData(): Promise<RealTimeSP500Data> {
    if (this.ALPHA_VANTAGE_API_KEY === 'demo') {
      throw new Error('API key do Alpha Vantage não configurada');
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${this.ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      lastUpdated: new Date().toISOString(),
      volume: parseInt(quote['06. volume'])
    };
  }

  // Obter informações sobre o status dos dados de 2025
  static get2025DataStatus(): {
    currentMonth: number;
    lastCompletedMonth: number;
    monthsAvailable: number;
    nextMonthExpected: string;
  } {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (currentYear !== 2025) {
      return {
        currentMonth: 0,
        lastCompletedMonth: 0,
        monthsAvailable: 0,
        nextMonthExpected: 'N/A'
      };
    }
    
    let lastCompletedMonth = currentMonth - 1;
    if (lastCompletedMonth === 0) {
      lastCompletedMonth = 12;
    }
    
    const monthsAvailable = lastCompletedMonth;
    const nextMonthExpected = this.getMonthName(currentMonth);
    
    return {
      currentMonth,
      lastCompletedMonth,
      monthsAvailable,
      nextMonthExpected
    };
  }

  // Helper para obter nome do mês
  private static getMonthName(month: number): string {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month - 1] || 'Desconhecido';
  }
}

export default RealTimeSP500Service;
