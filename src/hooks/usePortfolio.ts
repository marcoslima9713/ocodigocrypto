import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../integrations/supabase/client'
import { getCoinGeckoId } from '../services/cryptoPriceService'
import { useAuth } from '../contexts/AuthContext'
import { usePortfolioPrices } from './useCryptoPrices'

interface Transaction {
  id: string
  portfolio_id: string
  crypto_symbol: string
  transaction_type: string
  amount: number
  price_usd: number
  total_usd: number
  transaction_date: string
  created_at: string
  updated_at: string
  user_id: string
}

interface Holding {
  id: string
  portfolio_id: string
  crypto_symbol: string
  total_amount: number
  average_buy_price: number
  total_invested: number
  coinGeckoId?: string
}

interface PortfolioData {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercentage: number
  holdings: Holding[]
  transactions: Transaction[]
}

export function usePortfolio(portfolioId: string = 'main') {
  const { currentUser } = useAuth()
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalInvested: 0,
    currentValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
    holdings: [],
    transactions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hook para preços em tempo real com auto-update
  const {
    prices,
    loading: pricesLoading,
    error: pricesError,
    lastUpdated,
    isUpdating,
    updateStatus
  } = usePortfolioPrices(portfolioData.holdings, {
    enableAutoUpdate: true // Habilitado para atualização automática a cada 2 minutos
  })

  const fetchPortfolioData = useCallback(async () => {
    if (!currentUser) {
      console.log('👤 usePortfolio: Usuário não autenticado')
      return
    }

    console.log('🔄 usePortfolio: Iniciando busca de dados do portfólio')
    setLoading(true)
    setError(null)

    try {
      console.log('👤 usePortfolio: User ID:', currentUser.id)

      // Buscar transações do usuário
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: true })

      if (transactionsError) {
        throw new Error(`Erro ao buscar transações: ${transactionsError.message}`)
      }

      console.log('📈 usePortfolio: Transações encontradas:', transactions?.length || 0)

      if (!transactions || transactions.length === 0) {
        setPortfolioData({
          totalInvested: 0,
          currentValue: 0,
          profitLoss: 0,
          profitLossPercentage: 0,
          holdings: [],
          transactions: []
        })
        setLoading(false)
        console.log('✅ usePortfolio: Portfolio carregado com sucesso (vazio)')
        return
      }

      // Calcular holdings baseado nas transações
      const holdingsMap = new Map<string, Holding>()

      transactions.forEach((transaction: Transaction) => {
        const symbol = transaction.crypto_symbol
        const coinGeckoId = getCoinGeckoId(symbol)

        if (!holdingsMap.has(symbol)) {
          holdingsMap.set(symbol, {
            id: symbol,
            portfolio_id: portfolioId,
            crypto_symbol: symbol,
            total_amount: 0,
            average_buy_price: 0,
            total_invested: 0,
            coinGeckoId
          })
        }

        const holding = holdingsMap.get(symbol)!
        
        if (transaction.transaction_type === 'buy') {
          const newTotalAmount = holding.total_amount + transaction.amount
          const newTotalInvested = holding.total_invested + transaction.total_usd
          
          holding.total_amount = newTotalAmount
          holding.total_invested = newTotalInvested
          holding.average_buy_price = newTotalInvested / newTotalAmount
        } else if (transaction.transaction_type === 'sell') {
          // Para vendas, reduzir proporcionalmente
          const sellRatio = transaction.amount / holding.total_amount
          holding.total_amount -= transaction.amount
          holding.total_invested *= (1 - sellRatio)
          
          if (holding.total_amount > 0) {
            holding.average_buy_price = holding.total_invested / holding.total_amount
          } else {
            holding.average_buy_price = 0
          }
        }
      })

      // Filtrar holdings com quantidade > 0
      const holdings = Array.from(holdingsMap.values()).filter(h => h.total_amount > 0)

      console.log('📊 usePortfolio: Holdings calculados:', holdings.length)

      // Calcular valores totais
      const totalInvested = holdings.reduce((sum, holding) => sum + holding.total_invested, 0)
      
      // Calcular valor atual baseado nos preços em tempo real
      let currentValue = 0
      holdings.forEach(holding => {
        const priceData = prices[holding.coinGeckoId!]
        if (priceData) {
          currentValue += holding.total_amount * priceData.usd
        }
      })

      const profitLoss = currentValue - totalInvested
      const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

      const updatedPortfolioData: PortfolioData = {
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercentage,
        holdings,
        transactions
      }

      setPortfolioData(updatedPortfolioData)
      console.log('✅ usePortfolio: Dados do portfólio carregados com sucesso')
      console.log('💰 usePortfolio: Total investido:', totalInvested)
      console.log('💎 usePortfolio: Valor atual:', currentValue)
      console.log('📊 usePortfolio: Holdings processados:', holdings.length)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ usePortfolio: Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
      console.log('🏁 usePortfolio: Finalizando carregamento - loading definido como false')
    }
  }, [currentUser, portfolioId])

  // Efeito para buscar dados quando usuário muda
  useEffect(() => {
    if (currentUser) {
      console.log('🔄 usePortfolio: useEffect triggered - currentUser:', currentUser.id)
      fetchPortfolioData()
    }
  }, [currentUser?.id, portfolioId])

  // Função para adicionar transação
  const addTransaction = async (
    cryptoSymbol: string,
    transactionType: 'buy' | 'sell',
    amount: number,
    priceUsd: number
  ) => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    const totalUsd = amount * priceUsd

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: currentUser.id,
        portfolio_id: portfolioId,
        crypto_symbol: cryptoSymbol.toUpperCase(),
        transaction_type: transactionType,
        amount,
        price_usd: priceUsd,
        total_usd: totalUsd,
        transaction_date: new Date().toISOString()
      })
      .select()

    if (error) {
      throw new Error(`Erro ao adicionar transação: ${error.message}`)
    }

    // Recarregar dados do portfólio
    await fetchPortfolioData()

    return data?.[0]
  }

  // Função para remover transação
  const removeTransaction = async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', currentUser?.id)

    if (error) {
      throw new Error(`Erro ao remover transação: ${error.message}`)
    }

    // Recarregar dados do portfólio
    await fetchPortfolioData()
  }

  // Recalcular valores totais sempre que chegarem novos preços
  useEffect(() => {
    if (portfolioData.holdings.length === 0) return

    let currentValue = 0
    portfolioData.holdings.forEach(h => {
      const priceData = prices[h.coinGeckoId!]
      if (priceData) {
        currentValue += h.total_amount * priceData.usd
      }
    })

    const profitLoss = currentValue - portfolioData.totalInvested
    const profitLossPercentage = portfolioData.totalInvested > 0 ? (profitLoss / portfolioData.totalInvested) * 100 : 0

    setPortfolioData(prev => {
      if (
        prev.currentValue === currentValue &&
        prev.profitLoss === profitLoss &&
        prev.profitLossPercentage === profitLossPercentage
      ) {
        return prev // nada mudou
      }
      return {
        ...prev,
        currentValue,
        profitLoss,
        profitLossPercentage
      }
    })
  }, [prices, portfolioData.holdings])

  // Gerar dados do gráfico baseado nas transações
  const generateChartData = () => {
    if (!portfolioData.transactions.length) {
      return [{
        date: new Date().toISOString().split('T')[0],
        value: 0,
        invested: 0
      }]
    }

    // Agrupar transações por data e calcular totais acumulados
    const sortedTransactions = [...portfolioData.transactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    )

    const chartData = []
    let runningInvested = 0
    const holdings: { [symbol: string]: { amount: number; totalInvested: number } } = {}

    for (const transaction of sortedTransactions) {
      const date = transaction.transaction_date.split('T')[0]
      
      if (transaction.transaction_type === 'buy') {
        runningInvested += Number(transaction.total_usd)
        if (!holdings[transaction.crypto_symbol]) {
          holdings[transaction.crypto_symbol] = { amount: 0, totalInvested: 0 }
        }
        holdings[transaction.crypto_symbol].amount += Number(transaction.amount)
        holdings[transaction.crypto_symbol].totalInvested += Number(transaction.total_usd)
      } else {
        // Sell - reduzir holdings proporcionalmente
        if (holdings[transaction.crypto_symbol]) {
          const sellRatio = Number(transaction.amount) / holdings[transaction.crypto_symbol].amount
          holdings[transaction.crypto_symbol].amount -= Number(transaction.amount)
          holdings[transaction.crypto_symbol].totalInvested *= (1 - sellRatio)
          runningInvested = Object.values(holdings).reduce((sum, holding) => sum + holding.totalInvested, 0)
        }
      }

      // Calcular valor atual baseado nos preços atuais
      let currentValue = 0
      Object.entries(holdings).forEach(([symbol, holding]) => {
        const coinGeckoId = symbol.toLowerCase()
        const currentPrice = prices[coinGeckoId]?.usd || Number(transaction.price_usd)
        currentValue += holding.amount * currentPrice
      })

      chartData.push({
        date,
        value: Math.round(currentValue),
        invested: Math.round(runningInvested)
      })
    }

    // Adicionar ponto atual se não houver transações recentes
    if (chartData.length > 0) {
      const lastPoint = chartData[chartData.length - 1]
      const today = new Date().toISOString().split('T')[0]
      
      if (lastPoint.date !== today) {
        // Calcular valor atual baseado nos holdings atuais
        let currentValue = 0
        Object.entries(holdings).forEach(([symbol, holding]) => {
          const coinGeckoId = symbol.toLowerCase()
          const currentPrice = prices[coinGeckoId]?.usd || 0
          currentValue += holding.amount * currentPrice
        })

        chartData.push({
          date: today,
          value: Math.round(currentValue),
          invested: Math.round(runningInvested)
        })
      }
    }

    return chartData
  }

  return {
    ...portfolioData,
    loading: loading || pricesLoading,
    error: error || pricesError,
    addTransaction,
    removeTransaction,
    refetch: fetchPortfolioData,
    chartData: generateChartData(),
    lastUpdated,
    isUpdating,
    updateStatus
  }
}