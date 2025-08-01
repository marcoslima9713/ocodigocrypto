import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioRankingEntry, PortfolioRankings } from '@/integrations/supabase/types';

interface UsePortfolioRankingsOptions {
  timeWindow?: '7_days' | '30_days';
  limit?: number;
}

export function usePortfolioRankings(options: UsePortfolioRankingsOptions = {}) {
  const {
    timeWindow = '7_days',
    limit = 10
  } = options;

  const [rankings, setRankings] = useState<PortfolioRankings>({
    return_percent: [],
    top_asset: [],
    dca_strategy: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  const fetchRankings = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Buscar dados reais do banco
      const result = await supabase
        .from('portfolio_performance_rankings')
        .select('*')
        .eq('time_window', timeWindow)
        .order('return_percent', { ascending: false })
        .limit(limit);

      if (result.error) {
        console.error('Erro ao buscar rankings:', result.error);
        setError('Erro ao carregar rankings');
        setRankings({
          return_percent: [],
          top_asset: [],
          dca_strategy: []
        });
        setLoading(false);
        return;
      }

      // Se não há dados reais, retornar arrays vazios
      if (!result.data || result.data.length === 0) {
        setRankings({
          return_percent: [],
          top_asset: [],
          dca_strategy: []
        });
        setLoading(false);
        return;
      }

      // Processar dados reais
      const processedData = result.data.map((entry: any) => ({
        user_id: entry.user_id,
        user_name: entry.user_name,
        user_username: entry.user_username,
        user_created_at: entry.user_created_at,
        time_window: entry.time_window,
        return_percent: entry.return_percent,
        top_asset: entry.top_asset,
        top_asset_return: entry.top_asset_return,
        dca_purchase_count: entry.dca_purchase_count,
        dca_avg_price: entry.dca_avg_price,
        total_invested: entry.total_invested,
        total_current_value: entry.total_current_value,
        total_unrealized_pnl: entry.total_unrealized_pnl,
        badge: entry.badge
      }));

      setRankings({
        return_percent: processedData.slice(0, limit),
        top_asset: processedData.slice(0, limit),
        dca_strategy: processedData.slice(0, limit)
      });
    } catch (err) {
      console.error('Erro ao buscar rankings:', err);
      setError('Erro ao carregar rankings');
      setRankings({
        return_percent: [],
        top_asset: [],
        dca_strategy: []
      });
    } finally {
      setLoading(false);
    }
  }, [timeWindow, limit]);

  const refreshRankings = useCallback(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Função para formatar percentual
  const formatPercentage = useCallback((value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }, []);

  // Função para formatar valor monetário
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  // Função para obter cor baseada no retorno
  const getReturnColor = useCallback((value: number) => {
    if (value >= 20) return 'text-green-400';
    if (value >= 10) return 'text-green-500';
    if (value >= 0) return 'text-green-600';
    if (value >= -10) return 'text-red-600';
    return 'text-red-500';
  }, []);

  // Função para obter ícone do badge
  const getBadgeIcon = useCallback((badge?: string) => {
    switch (badge) {
      case 'Top Trader':
        return '🏆';
      case 'Elite Trader':
        return '🥇';
      case 'DCA Master':
        return '📈';
      default:
        return null;
    }
  }, []);

  // Função para obter cor do badge
  const getBadgeColor = useCallback((badge?: string) => {
    switch (badge) {
      case 'Top Trader':
        return 'bg-yellow-500 text-yellow-900';
      case 'Elite Trader':
        return 'bg-gray-500 text-white';
      case 'DCA Master':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-400 text-gray-700';
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return {
    rankings,
    loading,
    error,
    refreshRankings,
    formatPercentage,
    formatCurrency,
    getReturnColor,
    getBadgeIcon,
    getBadgeColor
  };
} 