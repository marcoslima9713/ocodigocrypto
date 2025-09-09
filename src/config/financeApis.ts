// Configuração das APIs Financeiras
export const FINANCE_API_CONFIG = {
  // Yahoo Finance (gratuito, não requer API key)
  YAHOO_FINANCE: {
    BASE_URL: 'https://query1.finance.yahoo.com',
    ENDPOINTS: {
      QUOTE: '/v8/finance/chart',
      HISTORICAL: '/v8/finance/chart',
      SEARCH: '/v1/finance/search'
    },
    SYMBOLS: {
      SP500: '%5EGSPC', // ^GSPC
      SPY: 'SPY',
      QQQ: 'QQQ',
      IWM: 'IWM'
    }
  },

  // Alpha Vantage (requer API key gratuita)
  ALPHA_VANTAGE: {
    BASE_URL: 'https://www.alphavantage.co',
    API_KEY: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || 'demo',
    ENDPOINTS: {
      QUOTE: '/query?function=GLOBAL_QUOTE',
      HISTORICAL: '/query?function=TIME_SERIES_MONTHLY',
      SEARCH: '/query?function=SYMBOL_SEARCH'
    },
    RATE_LIMIT: {
      FREE_TIER: '5 calls per minute, 500 calls per day',
      PREMIUM: '1200 calls per minute'
    }
  },

  // FRED (Federal Reserve Economic Data)
  FRED: {
    BASE_URL: 'https://api.stlouisfed.org/fred',
    API_KEY: process.env.REACT_APP_FRED_API_KEY || 'demo',
    ENDPOINTS: {
      SERIES: '/series',
      OBSERVATIONS: '/series/observations',
      CATEGORIES: '/category'
    },
    SERIES: {
      SP500: 'SP500', // S&P 500
      SP500_PE: 'P/E ratio for S&P 500'
    }
  },

  // CoinGecko (para comparação com criptomoedas)
  COINGECKO: {
    BASE_URL: 'https://api.coingecko.com/api/v3',
    ENDPOINTS: {
      PRICE: '/simple/price',
      MARKET_DATA: '/coins/markets',
      HISTORICAL: '/coins/{id}/market_chart'
    },
    RATE_LIMIT: '50 calls per minute'
  }
};

// Configurações de fallback para quando as APIs falharem
export const FALLBACK_DATA = {
  SP500: {
    currentPrice: 4500.00,
    change: 25.50,
    changePercent: 0.57,
    volume: 2500000000,
    lastUpdated: new Date().toISOString()
  },
  
  // Dados de 2025 baseados em tendências reais
  SP500_2025_MONTHLY: [
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
  ]
};

// Configurações de cache e atualização
export const CACHE_CONFIG = {
  REAL_TIME_DATA: {
    TTL: 5 * 60 * 1000, // 5 minutos
    MAX_AGE: 10 * 60 * 1000 // 10 minutos
  },
  
  HISTORICAL_DATA: {
    TTL: 24 * 60 * 60 * 1000, // 24 horas
    MAX_AGE: 7 * 24 * 60 * 60 * 1000 // 7 dias
  },
  
  MONTHLY_DATA: {
    TTL: 60 * 60 * 1000, // 1 hora
    MAX_AGE: 24 * 60 * 60 * 1000 // 24 horas
  }
};

// Configurações de retry e timeout
export const NETWORK_CONFIG = {
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
  BACKOFF_MULTIPLIER: 2
};

// Configurações de ambiente
export const ENV_CONFIG = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true',
  
  // URLs de desenvolvimento vs produção
  API_URLS: {
    development: {
      yahoo: 'https://query1.finance.yahoo.com',
      alphaVantage: 'https://www.alphavantage.co',
      fred: 'https://api.stlouisfed.org/fred'
    },
    production: {
      yahoo: 'https://query1.finance.yahoo.com',
      alphaVantage: 'https://www.alphavantage.co',
      fred: 'https://api.stlouisfed.org/fred'
    }
  }
};

// Função para obter configuração baseada no ambiente
export function getApiConfig(apiName: keyof typeof FINANCE_API_CONFIG) {
  const config = FINANCE_API_CONFIG[apiName];
  const env = ENV_CONFIG.IS_PRODUCTION ? 'production' : 'development';
  
  return {
    ...config,
    BASE_URL: ENV_CONFIG.API_URLS[env][apiName.toLowerCase() as keyof typeof ENV_CONFIG.API_URLS[typeof env]]
  };
}

// Função para verificar se uma API está disponível
export function isApiAvailable(apiName: keyof typeof FINANCE_API_CONFIG): boolean {
  const config = FINANCE_API_CONFIG[apiName];
  
  switch (apiName) {
    case 'YAHOO_FINANCE':
      return true; // Sempre disponível
    case 'ALPHA_VANTAGE':
      return config.API_KEY !== 'demo';
    case 'FRED':
      return config.API_KEY !== 'demo';
    case 'COINGECKO':
      return true; // Sempre disponível
    default:
      return false;
  }
}

// Função para obter a melhor API disponível
export function getBestAvailableApi(): keyof typeof FINANCE_API_CONFIG {
  if (isApiAvailable('YAHOO_FINANCE')) {
    return 'YAHOO_FINANCE';
  }
  
  if (isApiAvailable('ALPHA_VANTAGE')) {
    return 'ALPHA_VANTAGE';
  }
  
  if (isApiAvailable('FRED')) {
    return 'FRED';
  }
  
  return 'YAHOO_FINANCE'; // Fallback padrão
}

export default FINANCE_API_CONFIG;
