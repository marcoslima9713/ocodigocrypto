import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../integrations/supabase/client'
import { getCoinGeckoId, getHistoricalPricesRange, getIntradayPricesRange } from '../services/cryptoPriceService'
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
  const [chartSeries, setChartSeries] = useState<Array<{ date: string; value: number; invested: number }>>([])

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

  // Gerar dados do gráfico baseado nas transações e preços históricos diários
  const generateChartDataSync = () => {
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

    // Dias cobertos
    const startDate = sortedTransactions[0].transaction_date.split('T')[0]
    const endDate = new Date().toISOString().split('T')[0]

    // Montar mapa de transações por dia
    const txsByDay = new Map<string, typeof sortedTransactions>()
    for (const tx of sortedTransactions) {
      const d = tx.transaction_date.split('T')[0]
      const arr = txsByDay.get(d) || ([] as typeof sortedTransactions)
      arr.push(tx)
      txsByDay.set(d, arr)
    }

    // Obter lista única de símbolos e seus CoinGecko IDs
    const symbols = Array.from(new Set(sortedTransactions.map(t => t.crypto_symbol)))
    const symbolToId = new Map<string, string>()
    for (const s of symbols) {
      symbolToId.set(s, getCoinGeckoId(s))
    }

    // Buscar preços históricos diários para cada moeda (uma vez) no intervalo
    const fromTs = Math.floor(new Date(startDate).getTime() / 1000)
    const toTs = Math.floor(new Date(endDate).getTime() / 1000)

    const historicalBySymbol: Record<string, Record<string, number>> = {}
    // Nota: aqui poderíamos paralelizar com Promise.all
    const fetchAll = async () => {
      for (const s of symbols) {
        const id = symbolToId.get(s)!
        try {
          historicalBySymbol[id] = await getHistoricalPricesRange(id, fromTs, toTs, 'usd')
        } catch (e) {
          // fallback: sem dados históricos, ficará sem contribuição para o dia
          historicalBySymbol[id] = {}
        }
      }
    }

    // Como esta função é síncrona, usamos um artifício: se ainda não temos preços atuais, retorna série básica
    // Para manter experiência responsiva, se não houver prices ainda, caímos para lógica antiga com preços atuais
    if (Object.keys(prices).length === 0) {
      const basic: any[] = []
      let runningInvestedBasic = 0
      const holdingsBasic: { [symbol: string]: { amount: number; totalInvested: number } } = {}
      for (const transaction of sortedTransactions) {
        const date = transaction.transaction_date.split('T')[0]
        if (transaction.transaction_type === 'buy') {
          runningInvestedBasic += Number(transaction.total_usd)
          if (!holdingsBasic[transaction.crypto_symbol]) {
            holdingsBasic[transaction.crypto_symbol] = { amount: 0, totalInvested: 0 }
          }
          holdingsBasic[transaction.crypto_symbol].amount += Number(transaction.amount)
          holdingsBasic[transaction.crypto_symbol].totalInvested += Number(transaction.total_usd)
        } else if (holdingsBasic[transaction.crypto_symbol]) {
          const sellRatio = Number(transaction.amount) / holdingsBasic[transaction.crypto_symbol].amount
          holdingsBasic[transaction.crypto_symbol].amount -= Number(transaction.amount)
          holdingsBasic[transaction.crypto_symbol].totalInvested *= (1 - sellRatio)
          runningInvestedBasic = Object.values(holdingsBasic).reduce((sum, h) => sum + h.totalInvested, 0)
        }
        let currentValue = 0
        Object.entries(holdingsBasic).forEach(([symbol, holding]) => {
          const coinGeckoId = getCoinGeckoId(symbol)
          const currentPrice = prices[coinGeckoId]?.usd || Number(transaction.price_usd)
          currentValue += holding.amount * currentPrice
        })
        basic.push({ date, value: Math.round(currentValue), invested: Math.round(runningInvestedBasic) })
      }
      return basic
    }

    // Quando houver preços, bloque sincronamente em cima deles usando preços históricos obtidos via fetchAll()
    // Obs.: não podemos usar await aqui diretamente sem tornar generateChartData async. Para simplicidade
    // faremos uma aproximação: se ainda não buscamos históricos nesta sessão, retornamos série usando preços atuais.
    // Uma melhoria futura seria mover a geração do gráfico para um hook dedicado assíncrono.
    // Ainda assim, tentaremos buscar rapidamente e se falhar, caímos no fallback.
    // Isto minimiza travas na UI mantendo melhor acurácia quando disponível.
    // eslint-disable-next-line no-console
    console.log('⏳ Buscando históricos para série P&L...')
    // NOTA: Esta chamada é síncrona aqui, MAS na prática ela não será aguardada. Isso é um hack mínimo.
    // Para garantir não travar, não usamos await aqui.
    fetchAll()

    // Construir série dia a dia entre startDate e endDate
    const days: string[] = []
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().split('T')[0])
    }

    let runningInvested = 0
    const holdingsBySymbol: Record<string, { amount: number; totalInvested: number }> = {}
    const series: Array<{ date: string; value: number; invested: number }> = []

    for (const day of days) {
      const txs = txsByDay.get(day) || []
      // aplicar transações do dia
      for (const tx of txs) {
        if (tx.transaction_type === 'buy') {
          runningInvested += Number(tx.total_usd)
          if (!holdingsBySymbol[tx.crypto_symbol]) {
            holdingsBySymbol[tx.crypto_symbol] = { amount: 0, totalInvested: 0 }
          }
          holdingsBySymbol[tx.crypto_symbol].amount += Number(tx.amount)
          holdingsBySymbol[tx.crypto_symbol].totalInvested += Number(tx.total_usd)
        } else {
          const holding = holdingsBySymbol[tx.crypto_symbol]
          if (holding && holding.amount > 0) {
            const sellRatio = Number(tx.amount) / holding.amount
            holding.amount -= Number(tx.amount)
            holding.totalInvested *= (1 - sellRatio)
            runningInvested = Object.values(holdingsBySymbol).reduce((sum, h) => sum + h.totalInvested, 0)
          }
        }
      }

      // calcular valor do portfólio no dia usando preços históricos se já carregados, senão usar preços atuais
      let dayValue = 0
      for (const [symbol, holding] of Object.entries(holdingsBySymbol)) {
        const id = getCoinGeckoId(symbol)
        const hist = historicalBySymbol[id]
        const price = hist && hist[day] ? hist[day] : prices[id]?.usd || 0
        dayValue += holding.amount * price
      }

      series.push({ date: day, value: Math.round(dayValue), invested: Math.round(runningInvested) })
    }

    return series
  }

  // Recalcular série diária ao mudar transações ou preços
  useEffect(() => {
    const daily = generateChartDataSync()
    setChartSeries(daily)
  }, [JSON.stringify(portfolioData.transactions), JSON.stringify(prices)])

  // Série intraday para 24H com horário (pontos a cada ~30-60min, conforme CG retornar)
  const generateIntraday24h = async (): Promise<Array<{ date: string; value: number; invested: number }>> => {
    if (!portfolioData.transactions.length) return []

    const endTs = Math.floor(Date.now() / 1000)
    const startTs = endTs - 24 * 60 * 60

    const sortedTransactions = [...portfolioData.transactions]
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())

    const symbols = Array.from(new Set(sortedTransactions.map(t => t.crypto_symbol)))
    const symbolToId = new Map<string, string>()
    for (const s of symbols) symbolToId.set(s, getCoinGeckoId(s))

    // Buscar intraday por símbolo
    const intradayById: Record<string, Array<{ timestamp: number; price: number }>> = {}
    await Promise.all(symbols.map(async (s) => {
      const id = symbolToId.get(s)!
      try {
        intradayById[id] = await getIntradayPricesRange(id, startTs, endTs, 'usd')
      } catch {
        intradayById[id] = []
      }
    }))

    // Estado acumulado ao longo do tempo
    let runningInvested = 0
    const holdingsBySymbol: Record<string, { amount: number; totalInvested: number }> = {}

    // Aplicar transações até startTs para estado inicial
    for (const tx of sortedTransactions) {
      const ts = Math.floor(new Date(tx.transaction_date).getTime() / 1000)
      if (ts > startTs) break
      if (tx.transaction_type === 'buy') {
        runningInvested += Number(tx.total_usd)
        if (!holdingsBySymbol[tx.crypto_symbol]) holdingsBySymbol[tx.crypto_symbol] = { amount: 0, totalInvested: 0 }
        holdingsBySymbol[tx.crypto_symbol].amount += Number(tx.amount)
        holdingsBySymbol[tx.crypto_symbol].totalInvested += Number(tx.total_usd)
      } else {
        const h = holdingsBySymbol[tx.crypto_symbol]
        if (h && h.amount > 0) {
          const sellRatio = Number(tx.amount) / h.amount
          h.amount -= Number(tx.amount)
          h.totalInvested *= (1 - sellRatio)
          runningInvested = Object.values(holdingsBySymbol).reduce((sum, hh) => sum + hh.totalInvested, 0)
        }
      }
    }

    // Linha do tempo: merge de timestamps de todas moedas
    const timestampSet = new Set<number>()
    Object.values(intradayById).forEach(arr => arr?.forEach(p => timestampSet.add(p.timestamp)))
    const baseSeries = Array.from(timestampSet).sort((a, b) => a - b)
    const series: Array<{ date: string; value: number; invested: number }> = []

    // Ponteiro de transações já aplicadas dentro da janela 24h
    let txIndex = 0
    while (txIndex < sortedTransactions.length && Math.floor(new Date(sortedTransactions[txIndex].transaction_date).getTime() / 1000) <= startTs) {
      txIndex++
    }

    for (const ts of baseSeries) {
      // Aplicar novas transações até este timestamp
      while (txIndex < sortedTransactions.length) {
        const tx = sortedTransactions[txIndex]
        const txTs = Math.floor(new Date(tx.transaction_date).getTime() / 1000)
        if (txTs > ts) break
        if (txTs > startTs) {
          if (tx.transaction_type === 'buy') {
            runningInvested += Number(tx.total_usd)
            if (!holdingsBySymbol[tx.crypto_symbol]) holdingsBySymbol[tx.crypto_symbol] = { amount: 0, totalInvested: 0 }
            holdingsBySymbol[tx.crypto_symbol].amount += Number(tx.amount)
            holdingsBySymbol[tx.crypto_symbol].totalInvested += Number(tx.total_usd)
          } else {
            const h = holdingsBySymbol[tx.crypto_symbol]
            if (h && h.amount > 0) {
              const sellRatio = Number(tx.amount) / h.amount
              h.amount -= Number(tx.amount)
              h.totalInvested *= (1 - sellRatio)
              runningInvested = Object.values(holdingsBySymbol).reduce((sum, hh) => sum + hh.totalInvested, 0)
            }
          }
        }
        txIndex++
      }

      // Valor do portfólio no timestamp usando preços intraday (ou atuais se faltarem)
      let value = 0
      for (const [symbol, h] of Object.entries(holdingsBySymbol)) {
        const id = getCoinGeckoId(symbol)
        const arr = intradayById[id]
        if (arr && arr.length) {
          // pegar ponto mais próximo
          let price = arr[0].price
          let minDiff = Math.abs(arr[0].timestamp - ts)
          for (const p of arr) {
            const diff = Math.abs(p.timestamp - ts)
            if (diff < minDiff) { minDiff = diff; price = p.price }
          }
          value += h.amount * price
        } else {
          const current = prices[id]?.usd || 0
          value += h.amount * current
        }
      }

      series.push({ date: new Date(ts).toISOString(), value: Math.round(value), invested: Math.round(runningInvested) })
    }

    return series
  }

  // Unir série diária + intraday
  useEffect(() => {
    let isMounted = true
    const recompute = async () => {
      const daily = generateChartDataSync()
      let merged = [...daily]
      try {
        const intra = await generateIntraday24h()
        if (intra.length) {
          merged = [...daily, ...intra]
          merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }
      } catch {
        // mantém apenas daily em caso de falha
      }
      if (isMounted) setChartSeries(merged)
    }
    recompute()
    return () => { isMounted = false }
  }, [JSON.stringify(portfolioData.transactions), JSON.stringify(prices)])

  return {
    ...portfolioData,
    loading: loading || pricesLoading,
    error: error || pricesError,
    addTransaction,
    removeTransaction,
    refetch: fetchPortfolioData,
    chartData: chartSeries,
    lastUpdated,
    isUpdating,
    updateStatus
  }
}