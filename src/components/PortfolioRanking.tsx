import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  RefreshCw, 
  Calendar,
  Users,
  Target,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { usePortfolioRankings } from '@/hooks/usePortfolioRankings';
import { PortfolioRankingEntry } from '@/integrations/supabase/types';

interface PortfolioRankingProps {
  className?: string;
}

export function PortfolioRanking({ className = "" }: PortfolioRankingProps) {
  const [timeWindow, setTimeWindow] = useState<'7_days' | '30_days'>('7_days');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const {
    rankings,
    loading,
    error,
    refreshRankings,
    formatPercentage,
    formatCurrency,
    getReturnColor,
    getBadgeIcon,
    getBadgeColor
  } = usePortfolioRankings({ timeWindow, limit: 10 });

  // Monitorar status de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Tentar recarregar dados quando a conexão for restaurada
      if (error) {
        setTimeout(() => {
          refreshRankings();
        }, 1000);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, refreshRankings]);

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Função para obter cor do avatar baseada no nome
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Componente para cada entrada do ranking
  const RankingEntry = ({ 
    entry, 
    position, 
    category 
  }: { 
    entry: PortfolioRankingEntry; 
    position: number; 
    category: 'return_percent' | 'top_asset' | 'dca_strategy' 
  }) => {
    const getPositionColor = (pos: number) => {
      switch (pos) {
        case 1: return 'bg-yellow-500 text-yellow-900';
        case 2: return 'bg-gray-400 text-gray-700';
        case 3: return 'bg-orange-500 text-orange-900';
        default: return 'bg-zinc-700 text-zinc-300';
      }
    };

    const getPositionIcon = (pos: number) => {
      switch (pos) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return `#${pos}`;
      }
    };

    const getCategoryIcon = (cat: string) => {
      switch (cat) {
        case 'return_percent': return '📈';
        case 'top_asset': return '💎';
        case 'dca_strategy': return '📊';
        default: return '🏆';
      }
    };

    const getCategoryMetric = (cat: string, entry: PortfolioRankingEntry) => {
      switch (cat) {
        case 'return_percent':
          return (
            <div className="text-right">
              <div className={`text-lg font-bold ${getReturnColor(entry.return_percent)}`}>
                {formatPercentage(entry.return_percent)}
              </div>
              <div className="text-xs text-zinc-400">
                {formatCurrency(entry.total_invested)} → {formatCurrency(entry.total_current_value)}
              </div>
            </div>
          );
        case 'top_asset':
          return (
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">
                {entry.top_asset}
              </div>
              <div className={`text-sm ${getReturnColor(entry.top_asset_return || 0)}`}>
                {formatPercentage(entry.top_asset_return || 0)}
              </div>
            </div>
          );
        case 'dca_strategy':
          return (
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400">
                {entry.dca_purchase_count} compras
              </div>
              <div className="text-sm text-zinc-400">
                Preço médio: {formatCurrency(entry.dca_avg_price || 0)}
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: position * 0.1 }}
      >
        <Card className="mb-3 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Posição e Avatar */}
              <div className="flex items-center gap-3">
                <Badge className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getPositionColor(position)}`}>
                  {getPositionIcon(position)}
                </Badge>
                
                <Avatar className="w-10 h-10 border-2 border-zinc-700">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.user_name}`}
                    alt={entry.user_name}
                  />
                  <AvatarFallback className={`${getAvatarColor(entry.user_name)} text-white font-semibold`}>
                    {getInitials(entry.user_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="font-semibold text-white hover:text-blue-400 cursor-pointer transition-colors">
                    {entry.user_username ? `@${entry.user_username}` : entry.user_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">
                      {getCategoryIcon(category)}
                    </span>
                    {entry.badge && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-1 ${getBadgeColor(entry.badge)} border-current`}
                      >
                        {getBadgeIcon(entry.badge)} {entry.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Métrica principal */}
              <div className="flex items-center gap-4">
                {getCategoryMetric(category, entry)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Componente de loading skeleton
  const RankingSkeleton = () => (
    <Card className="mb-3 bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={`bg-zinc-900 border-zinc-800 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5" />
              Ranking de Performance
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {timeWindow === '7_days' ? '7 dias' : '30 dias'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="destructive" className="text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRankings}
              disabled={loading || !isOnline}
              className="text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Tabs de janela de tempo */}
        <Tabs value={timeWindow} onValueChange={(value) => setTimeWindow(value as '7_days' | '30_days')}>
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border border-zinc-700">
            <TabsTrigger value="7_days" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
              <Calendar className="w-3 h-3" />
              7 Dias
            </TabsTrigger>
            <TabsTrigger value="30_days" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
              <Calendar className="w-3 h-3" />
              30 Dias
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Mensagem de erro */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">⚠️</div>
            <p className="text-red-400 text-sm">{error}</p>
            {!isOnline && (
              <p className="text-zinc-400 text-xs mt-2">
                Verifique sua conexão com a internet
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshRankings}
              disabled={!isOnline}
              className="mt-2"
            >
              {isOnline ? 'Tentar novamente' : 'Sem conexão'}
            </Button>
          </div>
        )}

        {/* Tabs de categorias */}
        <Tabs defaultValue="return_percent" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800 border border-zinc-700">
            <TabsTrigger value="return_percent" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
              <TrendingUp className="w-3 h-3" />
              Retorno %
            </TabsTrigger>
            <TabsTrigger value="top_asset" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
              <Target className="w-3 h-3" />
              Melhor Ativo
            </TabsTrigger>
            <TabsTrigger value="dca_strategy" className="flex items-center gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">
              <DollarSign className="w-3 h-3" />
              Estratégia DCA
            </TabsTrigger>
          </TabsList>

          {/* Tab: Retorno Percentual */}
          <TabsContent value="return_percent" className="space-y-0">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Top 10 - Retorno Percentual</h3>
              <p className="text-sm text-zinc-400">
                Usuários com maior ganho relativo do portfólio
              </p>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <RankingSkeleton key={index} />
              ))
            ) : rankings.return_percent.length > 0 ? (
              <AnimatePresence>
                {rankings.return_percent.map((entry, index) => (
                  <RankingEntry
                    key={`${entry.user_id}-${timeWindow}`}
                    entry={entry}
                    position={index + 1}
                    category="return_percent"
                  />
                ))}
              </AnimatePresence>
                          ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aguardando Resultados
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4 max-w-md mx-auto">
                    O ranking será exibido assim que usuários da comunidade começarem a registrar transações e atingirem os critérios de elegibilidade.
                  </p>
                  <div className="bg-zinc-800 rounded-lg p-4 max-w-sm mx-auto">
                    <h4 className="text-white font-medium mb-2">Critérios de Elegibilidade:</h4>
                    <ul className="text-zinc-400 text-xs space-y-1">
                      <li>• Conta ativa há 7+ dias</li>
                      <li>• Investimento mínimo $100</li>
                      <li>• Perfil público ativado</li>
                      <li>• Transações registradas</li>
                    </ul>
                  </div>
                </div>
              )}
          </TabsContent>

          {/* Tab: Melhor Ativo */}
          <TabsContent value="top_asset" className="space-y-0">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Top 10 - Valorização de Cripto Específica</h3>
              <p className="text-sm text-zinc-400">
                Usuários com maior valorização de uma única criptomoeda
              </p>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <RankingSkeleton key={index} />
              ))
            ) : rankings.top_asset.length > 0 ? (
              <AnimatePresence>
                {rankings.top_asset.map((entry, index) => (
                  <RankingEntry
                    key={`${entry.user_id}-${timeWindow}`}
                    entry={entry}
                    position={index + 1}
                    category="top_asset"
                  />
                ))}
              </AnimatePresence>
                          ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💎</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aguardando Resultados
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4 max-w-md mx-auto">
                    O ranking será exibido assim que usuários da comunidade começarem a registrar transações e atingirem os critérios de elegibilidade.
                  </p>
                  <div className="bg-zinc-800 rounded-lg p-4 max-w-sm mx-auto">
                    <h4 className="text-white font-medium mb-2">Critérios de Elegibilidade:</h4>
                    <ul className="text-zinc-400 text-xs space-y-1">
                      <li>• Conta ativa há 7+ dias</li>
                      <li>• Investimento mínimo $100</li>
                      <li>• Perfil público ativado</li>
                      <li>• Transações registradas</li>
                    </ul>
                  </div>
                </div>
              )}
          </TabsContent>

          {/* Tab: Estratégia DCA */}
          <TabsContent value="dca_strategy" className="space-y-0">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Top 10 - Estratégia DCA</h3>
              <p className="text-sm text-zinc-400">
                Usuários com melhor resultado em Dollar-Cost Averaging
              </p>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <RankingSkeleton key={index} />
              ))
            ) : rankings.dca_strategy.length > 0 ? (
              <AnimatePresence>
                {rankings.dca_strategy.map((entry, index) => (
                  <RankingEntry
                    key={`${entry.user_id}-${timeWindow}`}
                    entry={entry}
                    position={index + 1}
                    category="dca_strategy"
                  />
                ))}
              </AnimatePresence>
                          ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aguardando Resultados
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4 max-w-md mx-auto">
                    O ranking será exibido assim que usuários da comunidade começarem a registrar transações e atingirem os critérios de elegibilidade.
                  </p>
                  <div className="bg-zinc-800 rounded-lg p-4 max-w-sm mx-auto">
                    <h4 className="text-white font-medium mb-2">Critérios de Elegibilidade:</h4>
                    <ul className="text-zinc-400 text-xs space-y-1">
                      <li>• Conta ativa há 7+ dias</li>
                      <li>• Investimento mínimo $100</li>
                      <li>• Perfil público ativado</li>
                      <li>• Transações registradas</li>
                    </ul>
                  </div>
                </div>
              )}
          </TabsContent>
        </Tabs>

        {/* Informações adicionais */}
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3" />
              <span>Usuários elegíveis: {rankings.return_percent.length || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span>Atualização automática diária</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3" />
              <span>Mínimo: $100 investidos</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 