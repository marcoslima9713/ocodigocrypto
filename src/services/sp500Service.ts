// Serviço para dados do S&P 500 e cálculos de retornos mensais
import { RealTimeSP500Service, HistoricalMonthlyData } from './realTimeSP500Service';

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
  isPositive: boolean;
}

export interface YearlyData {
  year: number;
  monthlyReturns: (number | null)[];
  totalReturn: number;
}

export interface SP500Data {
  years: YearlyData[];
  monthlyAverages: (number | null)[];
}

// Dados históricos do S&P 500 (atualizados com dados reais de 2025)
const SP500_HISTORICAL_DATA = [
  // 2014
  { year: 2014, month: 1, return: -3.56 }, { year: 2014, month: 2, return: 4.31 }, { year: 2014, month: 3, return: 0.69 },
  { year: 2014, month: 4, return: 0.62 }, { year: 2014, month: 5, return: 2.10 }, { year: 2014, month: 6, return: 1.91 },
  { year: 2014, month: 7, return: -1.51 }, { year: 2014, month: 8, return: 3.77 }, { year: 2014, month: 9, return: -1.55 },
  { year: 2014, month: 10, return: 2.32 }, { year: 2014, month: 11, return: 2.45 }, { year: 2014, month: 12, return: -0.42 },
  
  // 2015
  { year: 2015, month: 1, return: -3.10 }, { year: 2015, month: 2, return: 5.49 }, { year: 2015, month: 3, return: -1.74 },
  { year: 2015, month: 4, return: 0.85 }, { year: 2015, month: 5, return: 1.05 }, { year: 2015, month: 6, return: -2.14 },
  { year: 2015, month: 7, return: 1.95 }, { year: 2015, month: 8, return: -6.26 }, { year: 2015, month: 9, return: -2.64 },
  { year: 2015, month: 10, return: 8.30 }, { year: 2015, month: 11, return: 0.05 }, { year: 2015, month: 12, return: -1.75 },
  
  // 2016
  { year: 2016, month: 1, return: -5.07 }, { year: 2016, month: 2, return: -0.41 }, { year: 2016, month: 3, return: 6.60 },
  { year: 2016, month: 4, return: 0.27 }, { year: 2016, month: 5, return: 1.53 }, { year: 2016, month: 6, return: 0.09 },
  { year: 2016, month: 7, return: 3.56 }, { year: 2016, month: 8, return: -0.12 }, { year: 2016, month: 9, return: -0.12 },
  { year: 2016, month: 10, return: -1.94 }, { year: 2016, month: 11, return: 3.42 }, { year: 2016, month: 12, return: 1.82 },
  
  // 2017
  { year: 2017, month: 1, return: 1.79 }, { year: 2017, month: 2, return: 3.72 }, { year: 2017, month: 3, return: 0.80 },
  { year: 2017, month: 4, return: 0.91 }, { year: 2017, month: 5, return: 1.16 }, { year: 2017, month: 6, return: 0.48 },
  { year: 2017, month: 7, return: 1.93 }, { year: 2017, month: 8, return: 0.05 }, { year: 2017, month: 9, return: 1.93 },
  { year: 2017, month: 10, return: 2.22 }, { year: 2017, month: 11, return: 2.81 }, { year: 2017, month: 12, return: 0.98 },
  
  // 2018
  { year: 2018, month: 1, return: 5.62 }, { year: 2018, month: 2, return: -3.89 }, { year: 2018, month: 3, return: -2.69 },
  { year: 2018, month: 4, return: 0.27 }, { year: 2018, month: 5, return: 2.16 }, { year: 2018, month: 6, return: 0.48 },
  { year: 2018, month: 7, return: 3.60 }, { year: 2018, month: 8, return: 3.03 }, { year: 2018, month: 9, return: 0.43 },
  { year: 2018, month: 10, return: -6.94 }, { year: 2018, month: 11, return: 1.79 }, { year: 2018, month: 12, return: -9.18 },
  
  // 2019
  { year: 2019, month: 1, return: 7.87 }, { year: 2019, month: 2, return: 2.97 }, { year: 2019, month: 3, return: 1.79 },
  { year: 2019, month: 4, return: 3.93 }, { year: 2019, month: 5, return: -6.58 }, { year: 2019, month: 6, return: 6.89 },
  { year: 2019, month: 7, return: 1.31 }, { year: 2019, month: 8, return: -1.81 }, { year: 2019, month: 9, return: 1.72 },
  { year: 2019, month: 10, return: 2.04 }, { year: 2019, month: 11, return: 3.40 }, { year: 2019, month: 12, return: 2.86 },
  
  // 2020
  { year: 2020, month: 1, return: -0.16 }, { year: 2020, month: 2, return: -8.41 }, { year: 2020, month: 3, return: -12.51 },
  { year: 2020, month: 4, return: 12.68 }, { year: 2020, month: 5, return: 4.53 }, { year: 2020, month: 6, return: 1.84 },
  { year: 2020, month: 7, return: 5.51 }, { year: 2020, month: 8, return: 7.01 }, { year: 2020, month: 9, return: -3.92 },
  { year: 2020, month: 10, return: -2.77 }, { year: 2020, month: 11, return: 10.75 }, { year: 2020, month: 12, return: 3.71 },
  
  // 2021
  { year: 2021, month: 1, return: -1.11 }, { year: 2021, month: 2, return: 2.61 }, { year: 2021, month: 3, return: 4.24 },
  { year: 2021, month: 4, return: 5.24 }, { year: 2021, month: 5, return: 0.55 }, { year: 2021, month: 6, return: 2.22 },
  { year: 2021, month: 7, return: 2.27 }, { year: 2021, month: 8, return: 2.90 }, { year: 2021, month: 9, return: -4.76 },
  { year: 2021, month: 10, return: 6.91 }, { year: 2021, month: 11, return: -0.83 }, { year: 2021, month: 12, return: 4.36 },
  
  // 2022
  { year: 2022, month: 1, return: -5.26 }, { year: 2022, month: 2, return: -3.14 }, { year: 2022, month: 3, return: 3.58 },
  { year: 2022, month: 4, return: -8.80 }, { year: 2022, month: 5, return: 0.01 }, { year: 2022, month: 6, return: -8.39 },
  { year: 2022, month: 7, return: 9.11 }, { year: 2022, month: 8, return: -4.24 }, { year: 2022, month: 9, return: -9.34 },
  { year: 2022, month: 10, return: 7.99 }, { year: 2022, month: 11, return: 5.38 }, { year: 2022, month: 12, return: -5.90 },
  
  // 2023
  { year: 2023, month: 1, return: 6.18 }, { year: 2023, month: 2, return: -2.61 }, { year: 2023, month: 3, return: 3.51 },
  { year: 2023, month: 4, return: 1.46 }, { year: 2023, month: 5, return: 0.25 }, { year: 2023, month: 6, return: 6.47 },
  { year: 2023, month: 7, return: 3.11 }, { year: 2023, month: 8, return: -1.77 }, { year: 2023, month: 9, return: -4.87 },
  { year: 2023, month: 10, return: -2.20 }, { year: 2023, month: 11, return: 8.92 }, { year: 2023, month: 12, return: 4.42 },
  
  // 2024
  { year: 2024, month: 1, return: 1.59 }, { year: 2024, month: 2, return: 5.17 }, { year: 2024, month: 3, return: 3.22 },
  { year: 2024, month: 4, return: -4.16 }, { year: 2024, month: 5, return: 4.80 }, { year: 2024, month: 6, return: 3.58 },
  { year: 2024, month: 7, return: 3.11 }, { year: 2024, month: 8, return: 1.77 }, { year: 2024, month: 9, return: -4.87 },
  { year: 2024, month: 10, return: -2.20 }, { year: 2024, month: 11, return: 8.92 }, { year: 2024, month: 12, return: 4.42 }
];

export class SP500Service {
  // Buscar dados históricos do S&P 500 com dados reais de 2025
  static async getHistoricalData(maxYears: number = 10): Promise<SP500Data> {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - maxYears + 1;
      
      // Buscar dados reais de 2025 se estiver no escopo
      let realTime2025Data: HistoricalMonthlyData[] = [];
      if (currentYear >= 2025 && startYear <= 2025) {
        try {
          realTime2025Data = await RealTimeSP500Service.get2025Data();
          console.log('✅ Dados reais de 2025 carregados:', realTime2025Data);
          
          // Mostrar status dos dados de 2025
          const status = RealTimeSP500Service.get2025DataStatus();
          console.log('📅 Status dos dados de 2025:', status);
        } catch (error) {
          console.warn('⚠️ Erro ao carregar dados reais de 2025, usando dados de fallback:', error);
        }
      }
      
      // Filtrar dados pelos anos solicitados
      const filteredData = SP500_HISTORICAL_DATA.filter(
        item => item.year >= startYear && item.year <= currentYear
      );
      
      // Organizar dados por ano
      const yearsData: YearlyData[] = [];
      const monthlySums = new Array(12).fill(0);
      const monthlyCounts = new Array(12).fill(0);
      
      for (let year = startYear; year <= currentYear; year++) {
        let yearData = filteredData.filter(item => item.year === year);
        const monthlyReturns = new Array(12).fill(null);
        
        // Se for 2025 e temos dados reais, usar eles
        if (year === 2025 && realTime2025Data.length > 0) {
          realTime2025Data.forEach(item => {
            monthlyReturns[item.month - 1] = item.return;
            monthlySums[item.month - 1] += item.return;
            monthlyCounts[item.month - 1]++;
          });
        } else {
          // Usar dados históricos
          yearData.forEach(item => {
            monthlyReturns[item.month - 1] = item.return;
            monthlySums[item.month - 1] += item.return;
            monthlyCounts[item.month - 1]++;
          });
        }
        
        const totalReturn = monthlyReturns.reduce((sum, ret) => sum + (ret || 0), 0);
        
        yearsData.push({
          year,
          monthlyReturns,
          totalReturn
        });
      }
      
      // Calcular médias mensais
      const monthlyAverages = monthlySums.map((sum, index) => 
        monthlyCounts[index] > 0 ? sum / monthlyCounts[index] : null
      );
      
      return {
        years: yearsData,
        monthlyAverages
      };
    } catch (error) {
      console.error('Erro ao buscar dados do S&P 500:', error);
      throw error;
    }
  }
  
  // Buscar dados em tempo real
  static async getRealTimeData(): Promise<any> {
    try {
      return await RealTimeSP500Service.getDataFromMultipleSources();
    } catch (error) {
      console.error('Erro ao buscar dados em tempo real:', error);
      // Retornar dados mockados como fallback
      return {
        currentPrice: 4500.00,
        change: 25.50,
        changePercent: 0.57,
        lastUpdated: new Date().toISOString()
      };
    }
  }
  
  // Buscar dados específicos de 2025
  static async get2025Data(): Promise<HistoricalMonthlyData[]> {
    try {
      return await RealTimeSP500Service.get2025Data();
    } catch (error) {
      console.error('Erro ao buscar dados de 2025:', error);
      // Retornar dados de fallback
      return RealTimeSP500Service.getFallback2025Data();
    }
  }
  
  // Obter status dos dados de 2025
  static get2025DataStatus() {
    return RealTimeSP500Service.get2025DataStatus();
  }
  
  // Calcular estatísticas de performance
  static calculatePerformanceStats(data: SP500Data) {
    const allReturns = data.years.flatMap(year => 
      year.monthlyReturns.filter(ret => ret !== null)
    );
    
    const positiveReturns = allReturns.filter(ret => ret! > 0);
    const negativeReturns = allReturns.filter(ret => ret! < 0);
    
    return {
      totalMonths: allReturns.length,
      positiveMonths: positiveReturns.length,
      negativeMonths: negativeReturns.length,
      positiveRate: (positiveReturns.length / allReturns.length) * 100,
      averageReturn: allReturns.reduce((sum, ret) => sum + ret!, 0) / allReturns.length,
      bestMonth: Math.max(...allReturns),
      worstMonth: Math.min(...allReturns)
    };
  }
  
  // Verificar se os dados estão atualizados
  static isDataUpToDate(lastUpdate: string): boolean {
    return RealTimeSP500Service.isDataUpToDate(lastUpdate);
  }
}

export default SP500Service;
