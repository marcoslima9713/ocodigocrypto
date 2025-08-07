// Serviço para carregar dados históricos reais do Bitcoin
export interface HistoricalPriceData {
  [date: string]: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
}

let historicalData: HistoricalPriceData | null = null;

export const loadHistoricalData = async (): Promise<HistoricalPriceData> => {
  if (historicalData) {
    return historicalData;
  }

  try {
    console.log('📊 Carregando dados históricos do Bitcoin...');
    
    const response = await fetch('/data/btc_historical_data.json');
    if (!response.ok) {
      throw new Error(`Erro ao carregar dados históricos: ${response.status}`);
    }
    
    historicalData = await response.json();
    console.log(`✅ Dados históricos carregados: ${Object.keys(historicalData).length} registros`);
    
    return historicalData;
  } catch (error) {
    console.error('❌ Erro ao carregar dados históricos:', error);
    throw error;
  }
};

export const getPriceAtDate = (date: string): number | null => {
  if (!historicalData) {
    console.warn('⚠️ Dados históricos não carregados');
    return null;
  }

  // Tentar encontrar o preço exato na data
  if (historicalData[date]) {
    return historicalData[date].close;
  }

  // Se não encontrar, procurar a data mais próxima
  const dates = Object.keys(historicalData).sort();
  const targetDate = new Date(date);
  
  let closestDate = null;
  let minDiff = Infinity;
  
  for (const dataDate of dates) {
    const diff = Math.abs(new Date(dataDate).getTime() - targetDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestDate = dataDate;
    }
  }
  
  if (closestDate) {
    console.log(`📅 Preço não encontrado para ${date}, usando ${closestDate}`);
    return historicalData[closestDate].close;
  }
  
  return null;
};

export const getCurrentPrice = (): number | null => {
  if (!historicalData) {
    return null;
  }
  
  const dates = Object.keys(historicalData).sort();
  const latestDate = dates[dates.length - 1];
  
  return historicalData[latestDate].close;
};

export const getDataRange = (): { startDate: string; endDate: string } | null => {
  if (!historicalData) {
    return null;
  }
  
  const dates = Object.keys(historicalData).sort();
  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1]
  };
}; 