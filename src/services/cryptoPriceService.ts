import { CryptoPriceResponse, SymbolToCoinGeckoMap } from '../types/crypto'

const COINGECKO_API_KEY = 'CG-3ScWT3LGqP7RxgwHcp9yGVFw'
const BASE_URL = 'https://api.coingecko.com/api/v3'
const POLLING_INTERVAL = 2 * 60 * 1000 // 2 minutos
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// Cache em memória
const priceCache = new Map<string, { data: CryptoPriceResponse; timestamp: number }>()

// Controle de execução concorrente
let isUpdating = false
let updateInterval: NodeJS.Timeout | null = null
let lastUpdateTime: Date | null = null

// Sistema de eventos para notificar sobre atualizações
type PriceUpdateListener = (prices: CryptoPriceResponse, coins: string[]) => void
const priceUpdateListeners = new Set<PriceUpdateListener>()

// Mapeamento automático symbol → coinGeckoId
const SYMBOL_TO_COINGECKO: SymbolToCoinGeckoMap = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'XLM': 'stellar',
  'TRX': 'tron',
  'EOS': 'eos',
  'NEO': 'neo',
  'VET': 'vechain'
}

// Função para converter symbols em coinGeckoIds
const convertSymbolsToCoinGeckoIds = (symbols: string[]): string[] => {
  return symbols.map(symbol => {
    const upperSymbol = symbol.toUpperCase()
    return SYMBOL_TO_COINGECKO[upperSymbol] || symbol.toLowerCase()
  })
}

// Função para verificar se cache é válido
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL
}

// Função para gerar chave de cache
const generateCacheKey = (coinIds: string[], currencies: string): string => {
  return `${coinIds.sort().join(',')}_${currencies}`
}

// Função para emitir evento de atualização
const emitPriceUpdate = (prices: CryptoPriceResponse, coins: string[]) => {
  console.log('📡 Emitindo evento de atualização para', priceUpdateListeners.size, 'listeners')
  console.log('📡 Moedas atualizadas:', coins)
  
  priceUpdateListeners.forEach((listener) => {
    try {
      listener(prices, coins)
    } catch (error) {
      console.error('Erro no listener de atualização de preços:', error)
    }
  })
}

// Função para adicionar listener
export const addPriceUpdateListener = (listener: PriceUpdateListener) => {
  priceUpdateListeners.add(listener)
  return () => priceUpdateListeners.delete(listener)
}

// Função para obter preços em tempo real
export const getRealTimePrices = async (
  coinIds: string[],
  currencies: string = 'usd,brl',
  forceRefresh: boolean = false
): Promise<CryptoPriceResponse> => {
  // Converter symbols para coinGeckoIds se necessário
  const processedCoinIds = convertSymbolsToCoinGeckoIds(coinIds)
  
  // Gerar chave de cache
  const cacheKey = generateCacheKey(processedCoinIds, currencies)
  
  // Verificar cache (a menos que forceRefresh seja true)
  if (!forceRefresh) {
    const cached = priceCache.get(cacheKey)
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('📦 Usando dados do cache')
      return cached.data
    }
  }
  
  // Construir URL da API
  const params = new URLSearchParams({
    ids: processedCoinIds.join(','),
    vs_currencies: currencies,
    include_24hr_change: 'true',
    include_market_cap: 'true',
    include_24hr_vol: 'true',
    include_24hr_high: 'true',
    include_24hr_low: 'true'
  })
  
  const url = `${BASE_URL}/simple/price?${params.toString()}`
  
  console.log('🔄 Buscando preços em tempo real:', processedCoinIds)
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }
    
    const data: CryptoPriceResponse = await response.json()
    
    // Salvar no cache
    priceCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    
    // Emitir evento de atualização
    emitPriceUpdate(data, processedCoinIds)
    
    console.log('✅ Preços atualizados com sucesso')
    return data
    
  } catch (error) {
    console.error('❌ Erro ao buscar preços:', error)
    
    // Retornar dados do cache se disponível (mesmo expirado)
    const cached = priceCache.get(cacheKey)
    if (cached) {
      console.log('⚠️ Usando dados expirados do cache como fallback')
      return cached.data
    }
    
    throw error
  }
}

// Função para atualização automática
export const startAutoUpdate = (coinIds: string[]) => {
  if (updateInterval) {
    console.log('🔄 Auto-update já está ativo')
    return
  }
  
  console.log('🚀 Iniciando auto-update a cada 2 minutos')
  
  const updatePrices = async () => {
    if (isUpdating) {
      console.log('⏳ Atualização em andamento, pulando...')
      return
    }
    
    isUpdating = true
    console.log('🔄 Iniciando atualização automática...')
    
    try {
      await getRealTimePrices(coinIds, 'usd,brl', true)
      lastUpdateTime = new Date()
      console.log('✅ Atualização automática concluída')
    } catch (error) {
      console.error('❌ Erro na atualização automática:', error)
    } finally {
      isUpdating = false
    }
  }
  
  // Executar imediatamente apenas se não estiver atualizando
  if (!isUpdating) {
    updatePrices()
  }
  
  // Configurar intervalo
  updateInterval = setInterval(updatePrices, POLLING_INTERVAL)
}

// Função para parar auto-update
export const stopAutoUpdate = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
    console.log('🛑 Auto-update parado')
  }
}

// Função para forçar atualização manual
export const forceUpdate = async (coinIds: string[]) => {
  if (isUpdating) {
    console.log('⏳ Atualização em andamento, aguarde...')
    return
  }
  
  isUpdating = true
  console.log('🔄 Forçando atualização manual...')
  
  try {
    const data = await getRealTimePrices(coinIds, 'usd,brl', true)
    lastUpdateTime = new Date()
    console.log('✅ Atualização manual concluída')
    return data
  } catch (error) {
    console.error('❌ Erro na atualização manual:', error)
    throw error
  } finally {
    isUpdating = false
  }
}

// Função para obter status do sistema
export const getUpdateStatus = () => {
  return {
    isUpdating,
    lastUpdateTime,
    isAutoUpdateActive: !!updateInterval
  }
}

// Função para limpar cache
export const clearPriceCache = (): void => {
  priceCache.clear()
  console.log('🗑️ Cache de preços limpo')
}

// Função para obter estatísticas do cache
export const getCacheStats = (): { size: number; entries: string[] } => {
  return {
    size: priceCache.size,
    entries: Array.from(priceCache.keys())
  }
}

// Função para obter coinGeckoId de um symbol
export const getCoinGeckoId = (symbol: string): string => {
  const upperSymbol = symbol.toUpperCase()
  return SYMBOL_TO_COINGECKO[upperSymbol] || symbol.toLowerCase()
}

// Função para obter dados históricos de preços
export const getHistoricalPrices = async (
  coinId: string,
  fromDate: string, // OBS: não utilizado. Use getHistoricalPricesRange abaixo.
  toDate: string,   // OBS: não utilizado. Use getHistoricalPricesRange abaixo.
  currency: string = 'brl'
): Promise<Array<{ date: string; price: number }>> => {
  try {
    console.log(`📊 Buscando dados históricos para ${coinId} de ${fromDate} até ${toDate}`)
    
    // Manter compatibilidade: se receber timestamps numéricos em string use-os; caso contrário, jogue para os últimos 30 dias
    const now = Math.floor(Date.now() / 1000)
    const defaultFrom = now - 30 * 24 * 60 * 60
    const fromTs = /^\d{10,}$/.test(fromDate) ? Number(fromDate) : defaultFrom
    const toTs = /^\d{10,}$/.test(toDate) ? Number(toDate) : now

    const url = `${BASE_URL}/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${fromTs}&to=${toTs}&x_cg_demo_api_key=${COINGECKO_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Formato de resposta inválido da API')
    }
    
    // Converter timestamps para datas e preços
    const historicalData = data.prices.map(([timestamp, price]: [number, number]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      price: price
    }))
    
    console.log(`✅ Dados históricos obtidos: ${historicalData.length} pontos`)
    return historicalData
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados históricos:', error)
    throw error
  }
}

// Novo: obter preços históricos por intervalo (timestamps em segundos)
export const getHistoricalPricesRange = async (
  coinId: string,
  fromTimestamp: number,
  toTimestamp: number,
  currency: string = 'usd'
): Promise<Record<string, number>> => {
  try {
    const url = `${BASE_URL}/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${fromTimestamp}&to=${toTimestamp}&x_cg_demo_api_key=${COINGECKO_API_KEY}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Formato de resposta inválido da API (prices ausente)')
    }

    // Consolidar para 1 ponto por dia (último preço do dia)
    const dayToPrice: Record<string, number> = {}
    for (const [timestamp, price] of data.prices as [number, number][]) {
      const dayIso = new Date(timestamp).toISOString().split('T')[0]
      dayToPrice[dayIso] = price
    }
    return dayToPrice
  } catch (error) {
    console.error('❌ Erro ao buscar preços históricos (range):', error)
    throw error
  }
}

// Preços intraday (timestamps → price) sem consolidação diária
export const getIntradayPricesRange = async (
  coinId: string,
  fromTimestamp: number,
  toTimestamp: number,
  currency: string = 'usd'
): Promise<Array<{ timestamp: number; price: number }>> => {
  try {
    const url = `${BASE_URL}/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${fromTimestamp}&to=${toTimestamp}&x_cg_demo_api_key=${COINGECKO_API_KEY}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Formato de resposta inválido da API (prices ausente)')
    }
    return (data.prices as [number, number][])
      .map(([ts, price]) => ({ timestamp: ts, price }))
      .sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error('❌ Erro ao buscar preços intraday (range):', error)
    throw error
  }
}

// Função para obter preço em uma data específica
export const getPriceAtDate = async (
  coinId: string,
  targetDate: string, // formato: 'yyyy-mm-dd'
  currency: string = 'brl'
): Promise<number> => {
  try {
    // Converter data para timestamp
    const targetTimestamp = Math.floor(new Date(targetDate).getTime() / 1000)
    const fromTimestamp = targetTimestamp - (24 * 60 * 60) // 1 dia antes
    const toTimestamp = targetTimestamp + (24 * 60 * 60)   // 1 dia depois
    
    const url = `${BASE_URL}/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${fromTimestamp}&to=${toTimestamp}&x_cg_demo_api_key=${COINGECKO_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      throw new Error('Nenhum dado histórico encontrado para a data especificada')
    }
    
    // Encontrar o preço mais próximo da data alvo
    const targetTime = new Date(targetDate).getTime()
    let closestPrice = data.prices[0][1]
    let minDiff = Math.abs(data.prices[0][0] - targetTime)
    
    for (const [timestamp, price] of data.prices) {
      const diff = Math.abs(timestamp - targetTime)
      if (diff < minDiff) {
        minDiff = diff
        closestPrice = price
      }
    }
    
    return closestPrice
    
  } catch (error) {
    console.error('❌ Erro ao buscar preço na data específica:', error)
    throw error
  }
} 