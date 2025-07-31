import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

interface Transaction {
  id: string;
  portfolio_id: string;
  crypto_symbol: string;
  transaction_type: string;
  amount: number;
  price_usd: number;
  total_usd: number;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Holding {
  id: string;
  portfolio_id: string;
  crypto_symbol: string;
  total_amount: number;
  average_buy_price: number;
  total_invested: number;
}

interface PortfolioData {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  holdings: Holding[];
  transactions: Transaction[];
}

export function usePortfolio(portfolioId: string = 'main') {
  const { currentUser } = useAuth();
  const authenticatedUser = useSupabaseAuth(); // Ensures Supabase context is set
  const { prices } = useCryptoPrices();
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalInvested: 0,
    currentValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
    holdings: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = async () => {
    if (!currentUser) return;

    try {
      setError(null);
      setLoading(true);

      // Fetch holdings
      const { data: holdings, error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', currentUser.uid)
        .eq('portfolio_id', portfolioId);

      if (holdingsError) throw holdingsError;

      // Fetch transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.uid)
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Calculate portfolio metrics
      const totalInvested = holdings?.reduce((sum, holding) => sum + Number(holding.total_invested), 0) || 0;
      
      let currentValue = 0;
      if (holdings && holdings.length > 0) {
        currentValue = holdings.reduce((sum, holding) => {
          const currentPrice = prices[holding.crypto_symbol]?.current_price || Number(holding.average_buy_price);
          return sum + (Number(holding.total_amount) * currentPrice);
        }, 0);
      }

      const profitLoss = currentValue - totalInvested;
      const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

      setPortfolioData({
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercentage,
        holdings: holdings || [],
        transactions: transactions || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar portfólio');
      console.error('Erro ao buscar dados do portfólio:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (
    cryptoSymbol: string,
    transactionType: 'buy' | 'sell',
    amount: number,
    priceUsd: number
  ) => {
    if (!currentUser) return false;

    try {
      // Ensure Supabase context is set before making the transaction
      await supabase.rpc('set_config' as any, {
        setting_name: 'app.current_firebase_uid',
        setting_value: currentUser.uid,
        is_local: true
      });

      // Small delay to ensure the context is applied
      await new Promise(resolve => setTimeout(resolve, 100));

      const totalUsd = amount * priceUsd;

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.uid,
          portfolio_id: portfolioId,
          crypto_symbol: cryptoSymbol,
          transaction_type: transactionType,
          amount,
          price_usd: priceUsd,
          total_usd: totalUsd
        });

      if (error) throw error;

      // Refresh portfolio data
      await fetchPortfolioData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar transação');
      console.error('Erro ao adicionar transação:', err);
      return false;
    }
  };

  // Generate chart data based on transactions
  const generateChartData = () => {
    if (!portfolioData.transactions.length) {
      return [{
        date: new Date().toISOString().split('T')[0],
        value: 0,
        invested: 0
      }];
    }

    // Group transactions by date and calculate running totals
    const sortedTransactions = [...portfolioData.transactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const chartData = [];
    let runningInvested = 0;
    let holdings: { [symbol: string]: { amount: number; totalInvested: number } } = {};

    for (const transaction of sortedTransactions) {
      const date = transaction.transaction_date.split('T')[0];
      
      if (transaction.transaction_type === 'buy') {
        runningInvested += Number(transaction.total_usd);
        if (!holdings[transaction.crypto_symbol]) {
          holdings[transaction.crypto_symbol] = { amount: 0, totalInvested: 0 };
        }
        holdings[transaction.crypto_symbol].amount += Number(transaction.amount);
        holdings[transaction.crypto_symbol].totalInvested += Number(transaction.total_usd);
      } else {
        // Sell - reduce holdings proportionally
        if (holdings[transaction.crypto_symbol]) {
          const sellRatio = Number(transaction.amount) / holdings[transaction.crypto_symbol].amount;
          holdings[transaction.crypto_symbol].amount -= Number(transaction.amount);
          holdings[transaction.crypto_symbol].totalInvested *= (1 - sellRatio);
          runningInvested = Object.values(holdings).reduce((sum, holding) => sum + holding.totalInvested, 0);
        }
      }

      // Calculate current value based on current prices
      let currentValue = 0;
      Object.entries(holdings).forEach(([symbol, holding]) => {
        const currentPrice = prices[symbol]?.current_price || Number(transaction.price_usd);
        currentValue += holding.amount * currentPrice;
      });

      chartData.push({
        date,
        value: Math.round(currentValue),
        invested: Math.round(runningInvested)
      });
    }

    return chartData;
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [currentUser, portfolioId, prices]);

  return {
    ...portfolioData,
    loading,
    error,
    addTransaction,
    refetch: fetchPortfolioData,
    chartData: generateChartData()
  };
}