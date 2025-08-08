import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityFeedEntry } from '@/integrations/supabase/types';

interface UseCommunityFeedOptions {
  limit?: number;
  pollingInterval?: number; // em milissegundos
  enableWebSocket?: boolean;
}

export function useCommunityFeed(options: UseCommunityFeedOptions = {}) {
  const {
    limit = 50,
    pollingInterval = 120000, // 2 minutos
    enableWebSocket = false
  } = options;

  const [feed, setFeed] = useState<CommunityFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  const lastTimestampRef = useRef<string | null>(null);

  const fetchFeed = useCallback(async (newOffset = 0, append = false) => {
    try {
      setError(null);
      
      // Tentar buscar dados reais primeiro
      let data = null;
      let fetchError = null;
      
      try {
        const result = await supabase
          .from('community_feed')
          .select('*')
          .order('created_at', { ascending: false })
          .range(newOffset, newOffset + limit - 1);
        
        data = result.data;
        fetchError = result.error;
      } catch (dbError) {
        console.log('Erro ao conectar com banco de dados, usando dados simulados:', dbError);
        fetchError = dbError;
      }

      // Se há erro ou não há dados reais, retornar array vazio
      if (fetchError || !data || data.length === 0) {
        if (append) {
          setFeed(prev => [...prev]);
        } else {
          setFeed([]);
        }
        
        setHasMore(false);
        setOffset(newOffset);
        setLoading(false);
        return;
      }

      if (data) {
        if (append) {
          setFeed(prev => [...prev, ...data]);
        } else {
          setFeed(data);
          // Atualizar o timestamp da entrada mais recente
          if (data.length > 0) {
            lastTimestampRef.current = data[0].created_at;
          }
        }
        
        setHasMore(data.length === limit);
        setOffset(newOffset + data.length);
      }
    } catch (err) {
      console.error('Erro ao buscar feed da comunidade:', err);
      setError('Erro ao carregar feed da comunidade');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchFeed(offset, true);
    }
  }, [loading, hasMore, offset, fetchFeed]);

  const refreshFeed = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    fetchFeed(0, false);
  }, [fetchFeed]);

  // Função para formatar timestamp amigável
  const formatTimestamp = useCallback((timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'agora mesmo';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  }, []);

  // Função para obter ícone baseado no tipo de ação
  const getActionIcon = useCallback((actionType: string) => {
    switch (actionType) {
      case 'buy':
        return '📈';
      case 'sell':
        return '📉';
      case 'add':
        return '➕';
      default:
        return '💼';
    }
  }, []);

  // Função para obter cor baseada no tipo de ação e P&L
  const getActionColor = useCallback((actionType: string, pnlPercent?: number) => {
    if (actionType === 'sell' && pnlPercent !== undefined) {
      return pnlPercent >= 0 ? 'text-green-400' : 'text-red-400';
    }
    
    switch (actionType) {
      case 'buy':
        return 'text-blue-400';
      case 'sell':
        return 'text-orange-400';
      case 'add':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  }, []);

  // Função para formatar a mensagem do feed
  const formatFeedMessage = useCallback((entry: CommunityFeedEntry) => {
    const { user_display_name, user_username, action_type, asset, amount, price, total_value, pnl_percent } = entry;
    
    const userName = user_username ? `@${user_username}` : user_display_name;
    const formattedAmount = amount < 1 ? amount.toFixed(6) : amount.toFixed(2);
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
    
    const formattedTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(total_value);

    let message = '';
    
    switch (action_type) {
      case 'buy':
        message = `${userName} comprou ${formattedAmount} ${asset} por ${formattedPrice} cada (${formattedTotal} total)`;
        break;
      case 'sell':
        message = `${userName} vendeu ${formattedAmount} ${asset} por ${formattedPrice} cada (${formattedTotal} total)`;
        if (typeof pnl_percent === 'number' && !Number.isNaN(pnl_percent)) {
          const pnlText = pnl_percent >= 0 ? `+${Number(pnl_percent).toFixed(2)}%` : `${Number(pnl_percent).toFixed(2)}%`;
          message += ` com ${pnl_percent >= 0 ? 'lucro' : 'prejuízo'} de ${pnlText}`;
        }
        break;
      case 'add':
        message = `${userName} adicionou ${formattedTotal} em ${asset}`;
        break;
    }
    
    return message;
  }, []);

  // Configurar WebSocket para atualizações em tempo real
  useEffect(() => {
    if (enableWebSocket) {
      const subscription = supabase
        .channel('community_feed_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'community_feed'
          },
          (payload) => {
            const newEntry = payload.new as CommunityFeedEntry;
            
            // Adicionar nova entrada no topo do feed
            setFeed(prev => [newEntry, ...prev.slice(0, limit - 1)]);
            
            // Atualizar timestamp da entrada mais recente
            lastTimestampRef.current = newEntry.created_at;
          }
        )
        .subscribe();

      subscriptionRef.current = subscription;

      return () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }
      };
    }
  }, [enableWebSocket, limit]);

  // Configurar polling como fallback
  useEffect(() => {
    if (!enableWebSocket && pollingInterval > 0) {
      const startPolling = () => {
        pollingRef.current = setInterval(() => {
          // Buscar apenas entradas mais recentes que a última conhecida
          if (lastTimestampRef.current) {
            supabase
              .from('community_feed')
              .select('*')
              .gt('created_at', lastTimestampRef.current)
              .order('created_at', { ascending: false })
              .then(({ data, error }) => {
                if (!error && data && data.length > 0) {
                  setFeed(prev => [...data, ...prev.slice(0, limit - data.length)]);
                  lastTimestampRef.current = data[0].created_at;
                }
              });
          }
        }, pollingInterval);
      };

      startPolling();

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [enableWebSocket, pollingInterval, limit]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    feed,
    loading,
    error,
    hasMore,
    loadMore,
    refreshFeed,
    formatTimestamp,
    getActionIcon,
    getActionColor,
    formatFeedMessage
  };
} 