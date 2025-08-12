import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Eye,
  EyeOff,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { CommunityFeedEntry } from '@/types/database';
import { EmptyState } from '@/components/EmptyState';

interface CommunityFeedProps {
  className?: string;
  enableWebSocket?: boolean;
  showPrivacyToggle?: boolean;
}

export function CommunityFeed({ 
  className = "", 
  enableWebSocket = false,
  showPrivacyToggle = true 
}: CommunityFeedProps) {
  const [showWebSocketStatus, setShowWebSocketStatus] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const {
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
  } = useCommunityFeed({
    limit: 20,
    pollingInterval: enableWebSocket ? 0 : 120000, // 2 minutos se não usar WebSocket
    enableWebSocket
  });

  const {
    privacySettings,
    loading: privacyLoading,
    error: privacyError,
    toggleCommunityFeed,
    isPublic
  } = usePrivacySettings();

  // Simular status do WebSocket (em produção, usar estado real)
  useEffect(() => {
    if (enableWebSocket) {
      setIsWebSocketConnected(true);
      setShowWebSocketStatus(true);
      
      // Simular desconexão ocasional
      const interval = setInterval(() => {
        setIsWebSocketConnected(Math.random() > 0.1); // 90% do tempo conectado
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [enableWebSocket]);

  // Configurar Intersection Observer para lazy loading
  const lastElementCallback = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) {
      observerRef.current.observe(node);
      lastElementRef.current = node;
    }
  }, [loading, hasMore, loadMore]);

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

  // Componente para cada entrada do feed
  const FeedEntry = ({ entry, isLast }: { entry: CommunityFeedEntry; isLast: boolean }) => {
    const ref = isLast ? lastElementCallback : null;
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {/* Linha da timeline (esconde em telas pequenas) */}
        <div className="hidden sm:block absolute sm:left-8 top-12 bottom-0 w-0.5 bg-zinc-700" />
        
        <Card className="mb-3 sm:mb-4 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Avatar e ícone da ação */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-zinc-700">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.user_display_name}`}
                    alt={entry.user_display_name}
                  />
                  <AvatarFallback className={`${getAvatarColor(entry.user_display_name)} text-white font-semibold`}>
                    {getInitials(entry.user_display_name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Ícone da ação */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] sm:text-xs`}>
                  <span className="text-lg">{getActionIcon(entry.action_type)}</span>
                </div>
              </div>

              {/* Conteúdo da entrada */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-semibold text-white hover:text-blue-400 cursor-pointer transition-colors">
                    {entry.user_username ? `@${entry.user_username}` : entry.user_display_name}
                  </span>
                  
                  {/* Badge do tipo de ação */}
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${getActionColor(entry.action_type, entry.pnl_percent)} border-current`}
                  >
                    {entry.action_type === 'buy' && 'Compra'}
                    {entry.action_type === 'sell' && 'Venda'}
                    {entry.action_type === 'add' && 'Adição'}
                  </Badge>
                  
                  {/* P&L para vendas */}
                  {entry.action_type === 'sell' && typeof entry.pnl_percent === 'number' && !Number.isNaN(entry.pnl_percent) && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-1 ${
                        entry.pnl_percent >= 0 
                          ? 'text-green-400 border-green-400' 
                          : 'text-red-400 border-red-400'
                      }`}
                    >
                      {entry.pnl_percent >= 0 ? '+' : ''}{Number(entry.pnl_percent).toFixed(2)}%
                    </Badge>
                  )}
                </div>

                {/* Mensagem do feed */}
                <p className="text-zinc-300 text-sm leading-relaxed mb-2 break-words">
                  {formatFeedMessage(entry)}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-500">
                    {formatTimestamp(entry.created_at)}
                  </span>
                  
                  {/* Indicador de nova entrada */}
                  {new Date(entry.created_at) > new Date(Date.now() - 5 * 60 * 1000) && (
                    <Badge variant="outline" className="text-xs px-1 py-0.5 text-green-400 border-green-400">
                      Novo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Componente de loading skeleton
  const FeedEntrySkeleton = () => (
    <Card className="mb-3 sm:mb-4 bg-zinc-900 border-zinc-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={`bg-zinc-900 border-zinc-800 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              Feed da Comunidade
            </CardTitle>
            
            {/* Status do WebSocket */}
            {showWebSocketStatus && (
              <div className="flex items-center gap-2">
                {isWebSocketConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-xs text-zinc-400">
                  {isWebSocketConnected ? 'Tempo real' : 'Polling'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle de privacidade */}
            {showPrivacyToggle && (
              <Button
                variant="outline"
                size="sm"
                className={`text-xs ${isPublic ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}`}
                onClick={toggleCommunityFeed}
                disabled={privacyLoading}
              >
                {isPublic ? (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Público
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Privado
                  </>
                )}
              </Button>
            )}
            
            {/* Botão de refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshFeed}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Mensagem de erro */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">⚠️</div>
            <p className="text-red-400 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshFeed}
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Feed vazio */}
        {!loading && !error && feed.length === 0 && (
          <EmptyState
            icon={Users}
            title="Aguardando Atividades"
            description="O feed da comunidade será exibido assim que usuários começarem a registrar transações e compartilhar suas atividades."
            details="Configure seu perfil como público para aparecer no feed da comunidade"
          />
        )}

        {/* Lista do feed */}
        <div className="space-y-0">
          <AnimatePresence>
            {loading && feed.length === 0 ? (
              // Loading inicial
              Array.from({ length: 5 }).map((_, index) => (
                <FeedEntrySkeleton key={index} />
              ))
            ) : (
              // Feed com dados
              feed.map((entry, index) => (
                <FeedEntry
                  key={entry.id}
                  entry={entry}
                  isLast={index === feed.length - 1}
                />
              ))
            )}
          </AnimatePresence>

          {/* Loading mais itens */}
          {loading && feed.length > 0 && (
            <div className="text-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-400 mx-auto" />
              <p className="text-zinc-400 text-xs mt-2">Carregando mais...</p>
            </div>
          )}

          {/* Fim do feed */}
          {!loading && !hasMore && feed.length > 0 && (
            <div className="text-center py-4">
              <p className="text-zinc-500 text-xs">Fim do feed</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 