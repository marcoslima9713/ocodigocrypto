import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { usePortfolioPrices } from '../hooks/useCryptoPrices'
import { useCryptoImages } from '../hooks/useCryptoImages'
import { PortfolioAsset, CryptoPrice } from '../types/crypto'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, AlertCircle, Clock } from 'lucide-react'

interface PortfolioManagerProps {
  assets: PortfolioAsset[]
  onAssetUpdate?: (asset: PortfolioAsset) => void
  onAssetDelete?: (assetId: string) => void
}

interface PortfolioSummary {
  totalValueUSD: number
  totalValueBRL: number
  totalProfitLoss: number
  totalProfitLossPercentage: number
  bestPerformer: PortfolioAsset | null
  worstPerformer: PortfolioAsset | null
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  assets,
  onAssetUpdate,
  onAssetDelete
}) => {
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalValueUSD: 0,
    totalValueBRL: 0,
    totalProfitLoss: 0,
    totalProfitLossPercentage: 0,
    bestPerformer: null,
    worstPerformer: null
  })

  // Hook para preços em tempo real com auto-update
  const {
    prices,
    loading: pricesLoading,
    error: pricesError,
    refetch: refetchPrices,
    lastUpdated,
    isUpdating,
    updateStatus
  } = usePortfolioPrices(assets, {
    enableAutoUpdate: true // Habilitado para atualização automática a cada 2 minutos
  })

  // Hook para imagens das criptomoedas
  const { getCryptoImage } = useCryptoImages()

  // Calcular valores atualizados dos ativos
  const updatedAssets = useMemo(() => {
    return assets.map(asset => {
      const priceData = prices[asset.coinGeckoId]
      
      if (!priceData) {
        return asset
      }

      const currentPriceUSD = priceData.usd
      const currentPriceBRL = priceData.brl
      const priceChange24h = priceData.usd_24h_change || 0

      const totalValueUSD = asset.quantity * currentPriceUSD
      const totalValueBRL = asset.quantity * currentPriceBRL
      const totalCost = asset.quantity * asset.averagePrice
      const profitLoss = totalValueUSD - totalCost
      const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

      return {
        ...asset,
        currentPrice: {
          usd: currentPriceUSD,
          brl: currentPriceBRL,
          usd_24h_change: priceChange24h
        },
        totalValue: totalValueUSD,
        profitLoss,
        profitLossPercentage
      }
    })
  }, [assets, prices])

  // Calcular resumo do portfolio
  useEffect(() => {
    if (updatedAssets.length === 0) return

    const totalValueUSD = updatedAssets.reduce((sum, asset) => sum + (asset.totalValue || 0), 0)
    const totalValueBRL = updatedAssets.reduce((sum, asset) => {
      const priceData = prices[asset.coinGeckoId]
      return sum + (asset.quantity * (priceData?.brl || 0))
    }, 0)
    
    const totalCost = updatedAssets.reduce((sum, asset) => sum + (asset.quantity * asset.averagePrice), 0)
    const totalProfitLoss = totalValueUSD - totalCost
    const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0

    const assetsWithPerformance = updatedAssets.filter(asset => asset.profitLoss !== undefined)
    const bestPerformer = assetsWithPerformance.reduce((best, current) => 
      (current.profitLossPercentage || 0) > (best.profitLossPercentage || 0) ? current : best
    )
    const worstPerformer = assetsWithPerformance.reduce((worst, current) => 
      (current.profitLossPercentage || 0) < (worst.profitLossPercentage || 0) ? current : worst
    )

    setSummary({
      totalValueUSD,
      totalValueBRL,
      totalProfitLoss,
      totalProfitLossPercentage,
      bestPerformer: bestPerformer || null,
      worstPerformer: worstPerformer || null
    })
  }, [updatedAssets, prices])

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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes === 1) return '1 minuto atrás'
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1 hora atrás'
    return `${diffInHours} horas atrás`
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio</h2>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Última atualização: {formatTimeAgo(lastUpdated)}</span>
              </div>
            )}
            {(pricesLoading || isUpdating) && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {isUpdating ? 'Atualizando preços...' : 'Carregando...'}
              </div>
            )}
            {updateStatus.isAutoUpdateActive && (
              <Badge variant="secondary" className="text-xs">
                Auto-update ativo
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={() => refetchPrices()}
          disabled={pricesLoading || isUpdating}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(pricesLoading || isUpdating) ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Erro de preços */}
      {pricesError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Erro ao carregar preços: {pricesError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo do Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Resumo do Portfolio</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Valor Total (USD)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalValueUSD, 'USD')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Valor Total (BRL)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalValueBRL, 'BRL')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">P&L Total</p>
              <div className="flex items-center space-x-2">
                {getProfitLossIcon(summary.totalProfitLoss)}
                <p className={`text-2xl font-bold ${getProfitLossColor(summary.totalProfitLoss)}`}>
                  {formatCurrency(summary.totalProfitLoss, 'USD')}
                </p>
              </div>
              <p className={`text-sm ${getProfitLossColor(summary.totalProfitLossPercentage)}`}>
                {formatPercentage(summary.totalProfitLossPercentage)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Ativos</p>
              <p className="text-2xl font-bold">{assets.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ativos */}
      <div className="space-y-4">
        {updatedAssets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getCryptoImage(asset.symbol) || '/placeholder.svg'}
                      alt={asset.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div>
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-gray-500">{asset.symbol}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {asset.quantity.toFixed(4)} {asset.symbol}
                  </Badge>
                </div>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Preço Atual</p>
                      <p className="font-medium">
                        {asset.currentPrice ? formatCurrency(asset.currentPrice.usd, 'USD') : 'N/A'}
                      </p>
                      {asset.currentPrice?.usd_24h_change !== undefined && (
                        <p className={`text-xs ${getProfitLossColor(asset.currentPrice.usd_24h_change)}`}>
                          {formatPercentage(asset.currentPrice.usd_24h_change)} (24h)
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valor Total</p>
                      <p className="font-medium">
                        {asset.totalValue ? formatCurrency(asset.totalValue, 'USD') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">P&L</p>
                      <div className="flex items-center space-x-1">
                        {getProfitLossIcon(asset.profitLoss || 0)}
                        <p className={`font-medium ${getProfitLossColor(asset.profitLoss || 0)}`}>
                          {asset.profitLoss ? formatCurrency(asset.profitLoss, 'USD') : 'N/A'}
                        </p>
                      </div>
                      {asset.profitLossPercentage !== undefined && (
                        <p className={`text-xs ${getProfitLossColor(asset.profitLossPercentage)}`}>
                          {formatPercentage(asset.profitLossPercentage)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preço Médio</p>
                      <p className="font-medium">
                        {formatCurrency(asset.averagePrice, 'USD')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAssetUpdate?.(asset)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onAssetDelete?.(asset.id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {assets.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Nenhum ativo adicionado ao portfolio</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 