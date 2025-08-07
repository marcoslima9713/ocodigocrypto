import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CryptoPriceResponse } from '../types/crypto'
import { 
  getRealTimePrices, 
  addPriceUpdateListener, 
  startAutoUpdate, 
  stopAutoUpdate,
  forceUpdate,
  getUpdateStatus,
  clearPriceCache
} from '../services/cryptoPriceService'

interface UseCryptoPricesOptions {
  enableAutoUpdate?: boolean
  currencies?: string
  enableCache?: boolean
}

interface UseCryptoPricesReturn {
  prices: CryptoPriceResponse
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
  lastUpdated: Date | null
  isUpdating: boolean
  updateStatus: {
    isUpdating: boolean
    lastUpdateTime: Date | null
    isAutoUpdateActive: boolean
  }
}

export const useCryptoPrices = (
  inputCoinIds: string[] = [],
  options: UseCryptoPricesOptions = {}
): UseCryptoPricesReturn => {
  const {
    enableAutoUpdate = true,
    currencies = 'usd,brl',
    enableCache = true
  } = options

  // Normalizar coinIds para conjunto estável ordenado
  const stableCoinIds = useMemo(() => {
    const unique = Array.from(new Set(inputCoinIds))
    unique.sort()
    return unique
  }, [JSON.stringify(inputCoinIds.sort())])
  const coinIds = stableCoinIds

  const [prices, setPrices] = useState<CryptoPriceResponse>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const listenerRef = useRef<(() => void) | null>(null)
  const isInitializedRef = useRef(false)

  // Função para buscar preços
  const fetchPrices = useCallback(async (signal?: AbortSignal, forceRefresh: boolean = false) => {
    if (coinIds.length === 0) {
      setLoading(false)
      return
    }

    setLoading(true)
    setIsUpdating(true)
    setError(null)

    try {
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Criar novo AbortController
      abortControllerRef.current = new AbortController()

      const data = await getRealTimePrices(coinIds, currencies, forceRefresh)
      
      // Verificar se a requisição foi cancelada
      if (signal?.aborted) {
        return
      }

      // Sempre atualizar quando forceRefresh é true ou quando há dados novos
      if (forceRefresh || Object.keys(data).length > 0) {
        console.log('💰 Atualizando preços:', Object.keys(data).length, 'moedas')
        setPrices(data)
        setLastUpdated(new Date())
        console.log('✅ Preços atualizados com sucesso')
      } else {
        console.log('📦 Dados inalterados, mantendo cache')
      }
      setError(null)
      
    } catch (err) {
      if (signal?.aborted) {
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ Erro ao buscar preços:', err)
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
        setIsUpdating(false)
      }
    }
  }, [coinIds, currencies])

  // Função para refetch manual
  const refetch = useCallback(async () => {
    await fetchPrices(undefined, true)
  }, [fetchPrices])

  // Função para limpar cache
  const clearCache = useCallback(() => {
    clearPriceCache()
    console.log('🗑️ Cache limpo manualmente')
  }, [])

  // Efeito para inicialização e auto-update
  useEffect(() => {
    if (coinIds.length === 0) {
      setLoading(false)
      return
    }

    console.log('🔄 useCryptoPrices: Inicializando com', coinIds.length, 'moedas')

    // Buscar preços iniciais apenas se não estiver carregando
    if (!loading) {
      fetchPrices()
    }

    // Configurar auto-update se habilitado
    if (enableAutoUpdate && !isInitializedRef.current) {
      console.log('🚀 Configurando auto-update para:', coinIds)
      startAutoUpdate(coinIds)
      isInitializedRef.current = true
    }

    // Cleanup ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [coinIds]) // dependência apenas coinIds estável

  // Efeito para configurar listener de atualizações
  useEffect(() => {
    if (coinIds.length === 0) return

    console.log('📡 Configurando listener para:', coinIds)

    const unsubscribe = addPriceUpdateListener((updatedPrices, updatedCoins) => {
      // Verificar se alguma das moedas atualizadas é relevante para este hook
      const relevantCoins = updatedCoins.filter(coin => coinIds.includes(coin))
      
      if (relevantCoins.length > 0) {
        console.log('🔄 Recebida atualização externa para:', relevantCoins)
        
        // Atualizar todos os preços com os dados mais recentes
        setPrices(prevPrices => {
          const newPrices = { ...prevPrices }
          relevantCoins.forEach(coin => {
            if (updatedPrices[coin]) {
              newPrices[coin] = updatedPrices[coin]
            }
          })
          return newPrices
        })
        setLastUpdated(new Date())
        setIsUpdating(false)
      }
    })

    listenerRef.current = unsubscribe

    return () => {
      if (listenerRef.current) {
        listenerRef.current()
      }
    }
  }, [coinIds])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Obter status do sistema
  const updateStatus = getUpdateStatus()

  return {
    prices,
    loading,
    error,
    refetch,
    clearCache,
    lastUpdated,
    isUpdating,
    updateStatus
  }
}

// Hook especializado para preços de portfolio
export const usePortfolioPrices = (
  portfolioAssets: Array<{ coinGeckoId: string }> = [],
  options: UseCryptoPricesOptions = {}
) => {
  const coinIds = useMemo(() => portfolioAssets.map(asset => asset.coinGeckoId).filter(Boolean), [JSON.stringify(portfolioAssets.map(a=>a.coinGeckoId).sort())])
  return useCryptoPrices(coinIds, options)
}

// Hook para preço de uma única moeda
export const useSingleCryptoPrice = (
  coinId: string,
  options: UseCryptoPricesOptions = {}
) => {
  return useCryptoPrices([coinId], options)
}
