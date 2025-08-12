import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioRankingEntry, PortfolioRankings } from '@/types/database';

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

  // Função para buscar dados da nova materialized view
  const fetchRankingsFromView = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Verificar conectividade
      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet');
      }

      console.log('🔄 Buscando ranking da nova materialized view...');

      // Buscar dados da nova view
      const { data: rankingData, error: viewError } = await supabase
        .from('portfolio_performance_rankings_v2')
        .select('*')
        .order('return_percent', { ascending: false })
        .limit(limit);

      if (viewError) {
        throw new Error(`Erro ao buscar ranking: ${viewError.message}`);
      }

      console.log('✅ Dados do ranking obtidos:', rankingData?.length || 0);

      if (!rankingData || rankingData.length === 0) {
        setRankings({
          return_percent: [],
          top_asset: [],
          dca_strategy: []
        });
        setLoading(false);
        return;
      }

      // Converter dados da view para o formato esperado pelo componente
      const formattedRankings: PortfolioRankingEntry[] = rankingData.map((entry, index) => ({
        user_id: entry.user_id,
        user_name: entry.user_name || 'Usuário Anônimo',
        user_username: entry.user_email?.split('@')[0] || '',
        user_email: entry.user_email,
        user_created_at: entry.user_created_at,
        time_window: timeWindow,
        return_percent: entry.return_percent || 0,
        top_asset: 'N/A', // A nova view não tem top_asset, mas mantemos para compatibilidade
        top_asset_return: entry.return_percent || 0,
        dca_purchase_count: 0, // A nova view não tem DCA count, mas mantemos para compatibilidade
        total_invested: entry.total_invested || 0,
        total_current_value: entry.total_current_value || 0,
        total_unrealized_pnl: entry.profit_usd || 0,
        profit_usd: entry.profit_usd || 0,
        dca_avg_price: 0,
        badge: getBadgeForReturn(entry.return_percent || 0)
      }));

      console.log('📊 Ranking formatado:', formattedRankings.length, 'usuários');

      setRankings({
        return_percent: formattedRankings,
        top_asset: formattedRankings,
        dca_strategy: formattedRankings
      });

    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
          setError('Sem conexão com a internet. Verifique sua conexão.');
        } else if (err.message.includes('timeout')) {
          setError('Tempo limite excedido. Tente novamente.');
        } else {
          setError('Erro ao carregar rankings. Tente novamente.');
        }
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      
      setRankings({
        return_percent: [],
        top_asset: [],
        dca_strategy: []
      });
    } finally {
      setLoading(false);
    }
  }, [timeWindow, limit]);

  // Função para determinar badge baseado no retorno
  const getBadgeForReturn = (returnPercent: number): 'Top Trader' | 'Elite Trader' | 'DCA Master' | undefined => {
    if (returnPercent >= 50) return 'Top Trader';
    if (returnPercent >= 25) return 'Elite Trader';
    if (returnPercent >= 10) return 'DCA Master';
    return undefined;
  };

  const refreshRankings = useCallback(() => {
    fetchRankingsFromView();
  }, [fetchRankingsFromView]);

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
    fetchRankingsFromView();
  }, [fetchRankingsFromView]);

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