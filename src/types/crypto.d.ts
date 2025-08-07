export interface CryptoPrice {
  usd: number
  brl: number
  usd_24h_change: number
  brl_24h_change?: number
  market_cap?: number
  total_volume?: number
  high_24h?: number
  low_24h?: number
}

export interface PortfolioAsset {
  id: string
  coinGeckoId: string // ex: 'bitcoin'
  symbol: string // ex: 'BTC'
  name: string
  quantity: number
  averagePrice: number
  currentPrice?: CryptoPrice
  totalValue?: number
  profitLoss?: number
  profitLossPercentage?: number
  createdAt: string
  updatedAt: string
}

export interface CryptoPriceResponse {
  [coinId: string]: {
    usd: number
    brl: number
    usd_24h_change: number
    brl_24h_change?: number
    market_cap?: number
    total_volume?: number
    high_24h?: number
    low_24h?: number
  }
}

export interface SymbolToCoinGeckoMap {
  [symbol: string]: string
}

export interface CacheEntry {
  data: CryptoPriceResponse
  timestamp: number
  ttl: number
} 