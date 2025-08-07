import React, { useState } from 'react'
import { PortfolioManager } from '../components/PortfolioManager'
import { usePortfolioPrices } from '../hooks/useCryptoPrices'
import { PortfolioAsset } from '../types/crypto'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

// Exemplo de dados de portfolio
const sampleAssets: PortfolioAsset[] = [
  {
    id: '1',
    coinGeckoId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 0.5,
    averagePrice: 45000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    coinGeckoId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    quantity: 2.5,
    averagePrice: 2800,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    coinGeckoId: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    quantity: 1000,
    averagePrice: 0.45,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    coinGeckoId: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    quantity: 10,
    averagePrice: 95,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export const PortfolioExample: React.FC = () => {
  const [assets, setAssets] = useState<PortfolioAsset[]>(sampleAssets)
  const [showCacheStats, setShowCacheStats] = useState(false)

  // Hook para preços em tempo real
  const {
    prices,
    loading: pricesLoading,
    error: pricesError,
    refetch: refetchPrices,
    clearCache,
    cacheStats,
    lastUpdated
  } = usePortfolioPrices(assets, {
    refreshInterval: 4 * 60 * 60 * 1000, // 4 horas
    enableAutoRefresh: false // Desabilitado para evitar atualizações constantes
  })

  const handleAssetUpdate = (updatedAsset: PortfolioAsset) => {
    setAssets(prev => 
      prev.map(asset => 
        asset.id === updatedAsset.id ? updatedAsset : asset
      )
    )
  }

  const handleAssetDelete = (assetId: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== assetId))
  }

  const formatCurrency = (value: number, currency: 'USD' | 'BRL' = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getProfitLossIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />
    if (value < 0) return <TrendingDown className="w-4 h-4" />
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crypto Portfolio - Exemplo</h1>
          <p className="text-gray-600">Sistema de preços em tempo real com CoinGecko</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={refetchPrices}
            disabled={pricesLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${pricesLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={clearCache}
            variant="outline"
            size="sm"
          >
            Limpar Cache
          </Button>
          
          <Button
            onClick={() => setShowCacheStats(!showCacheStats)}
            variant="outline"
            size="sm"
          >
            Cache Stats
          </Button>
        </div>
      </div>

      {/* Status dos preços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Status dos Preços</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={pricesError ? "destructive" : "default"}>
                {pricesError ? 'Erro' : pricesLoading ? 'Carregando...' : 'Ativo'}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Última Atualização</p>
              <p className="font-medium">
                {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Moedas Monitoradas</p>
              <p className="font-medium">{Object.keys(prices).length}</p>
            </div>
          </div>
          
          {pricesError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{pricesError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas do Cache */}
      {showCacheStats && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Tamanho do Cache:</strong> {cacheStats.size} entradas</p>
              <p><strong>Entradas:</strong></p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {cacheStats.entries.map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preços em Tempo Real */}
      <Card>
        <CardHeader>
          <CardTitle>Preços em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(prices).map(([coinId, priceData]) => (
              <div key={coinId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold capitalize">{coinId}</h3>
                    <p className="text-2xl font-bold">
                      {formatCurrency(priceData.usd, 'USD')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(priceData.brl, 'BRL')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {getProfitLossIcon(priceData.usd_24h_change)}
                      <span className={`text-sm ${getProfitLossColor(priceData.usd_24h_change)}`}>
                        {formatPercentage(priceData.usd_24h_change)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">24h</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Manager */}
      <PortfolioManager
        assets={assets}
        onAssetUpdate={handleAssetUpdate}
        onAssetDelete={handleAssetDelete}
      />
    </div>
  )
} 