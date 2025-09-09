// Página do Módulo "Máquina de Alavancagem 2" - Pools de Liquidez
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, DollarSign, Clock, AlertTriangle, CheckCircle, RefreshCw, Calculator, BarChart3, Target, Zap, Shield, Search, Filter, Globe, TrendingDown, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { liquidityService, LiquidityPool, NetworkInfo, LiquidityOpportunity } from '@/services/liquidityService';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration?: string;
  videoUrl?: string;
  order_index: number;
  isCompleted: boolean;
}

export default function FundingArbitrageModule() {
  const navigate = useNavigate();
  const { '*': moduleId } = useParams();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleData, setModuleData] = useState<any>(null);
  const [moduleCover, setModuleCover] = useState<string>('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Estados para o monitoramento de pools de liquidez
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [opportunities, setOpportunities] = useState<LiquidityOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [selectedSortBy, setSelectedSortBy] = useState<string>('tvl');
  const [searchToken, setSearchToken] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LiquidityPool[]>([]);
  const [activeTab, setActiveTab] = useState<string>('opportunities');



  // Carregar módulo e vídeos do Supabase
  useEffect(() => {
    const currentModuleId = window.location.pathname.split('/').pop();
    console.log('🔄 Carregando dados do módulo Máquina de Alavancagem 2:', currentModuleId);
    
    const fetchModuleData = async () => {
      try {
        // Buscar dados do módulo
        const { data: moduleInfo, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', currentModuleId)
          .single();
        
        if (moduleError) {
          console.error('❌ Erro ao carregar módulo:', moduleError);
          return;
        }
        
        setModuleData(moduleInfo);
        console.log('📊 Dados do módulo carregados:', moduleInfo);
        
        // Buscar capa do módulo
        try {
          const { data: coverData, error: coverError } = await supabase
            .from('module_covers')
            .select('cover_url')
            .eq('slug', currentModuleId)
            .single();
          
          if (!coverError && coverData) {
            setModuleCover(coverData.cover_url);
          }
        } catch (error) {
          console.log('Capa personalizada não encontrada, usando padrão');
        }
        
        // Buscar vídeos do módulo
        const { data: videosData, error: videosError } = await supabase
          .from('video_lessons')
          .select('*')
          .eq('module_id', currentModuleId)
          .eq('status', 'publicado')
          .order('order_index');
        
        if (videosData && !videosError) {
          const convertedLessons: Lesson[] = videosData.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description || '',
            duration: video.duration ? `${Math.ceil(video.duration / 60)} min` : '',
            order_index: video.order_index || 0,
            isCompleted: false
          }));
          
          setLessons(convertedLessons);
        }
      } catch (error) {
        console.error('❌ Erro geral ao carregar dados:', error);
      }
    };

    if (currentModuleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  // Carregar dados de pools de liquidez
  const loadLiquidityData = async () => {
    setIsLoading(true);
    try {
      const [networkPools, networkList, topOpps] = await Promise.all([
        liquidityService.getNetworkPools(selectedNetwork, selectedSortBy, 50), // Aumentado para 50 pools
        liquidityService.getAvailableNetworks(),
        liquidityService.getTopOpportunities(selectedNetwork, 15) // Aumentado para 15 oportunidades
      ]);
      
      setPools(networkPools);
      setNetworks(networkList);
      setOpportunities(topOpps);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados de pools de liquidez:', error);
    } finally {
      setIsLoading(false);
    }
  };



  // Função para aplicar filtros
  const applyFilters = () => {
    loadLiquidityData();
  };

  useEffect(() => {
    loadLiquidityData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadLiquidityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedNetwork, selectedSortBy]);

  // Buscar pools por token
  const searchPools = async () => {
    if (!searchToken.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await liquidityService.searchPoolsByToken(searchToken, selectedNetwork);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar pools:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(searchPools, 500);
    return () => clearTimeout(timeoutId);
  }, [searchToken, selectedNetwork]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-600';
      case 'MEDIUM': return 'bg-yellow-600';
      case 'HIGH': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'Baixo';
      case 'MEDIUM': return 'Médio';
      case 'HIGH': return 'Alto';
      default: return 'Desconhecido';
    }
  };

  // Função para obter cor baseada no APY
  const getApyColor = (apy: number): string => {
    if (apy >= 20) return 'bg-green-600';
    if (apy >= 15) return 'bg-yellow-600';
    if (apy >= 10) return 'bg-orange-600';
    return 'bg-red-600';
  };

  // Função para obter cor do texto
  const getTextColor = (value: number): string => {
    if (isNaN(value) || value === 0) return 'text-gray-400';
    return (value > 15 && value <= 25) ? 'text-black' : 'text-white';
  };

  // Oportunidades ativas para exibição especial
  const topOpportunities = opportunities.slice(0, 5);
  const totalTvl = pools.reduce((sum, pool) => sum + pool.tvl, 0);
  const totalVolume = pools.reduce((sum, pool) => sum + pool.volume_24h, 0);

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-zinc-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={loadLiquidityData} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Pools de Liquidez
              <Badge variant="outline" className="ml-2">
                <Activity className="w-3 h-3 mr-1" />
                YIELD FARMING
              </Badge>
            </CardTitle>
            <div className="text-zinc-400 text-sm">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Carregando dados de pools de liquidez...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Filtros e Controles */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-zinc-300 text-sm">Rede</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map(network => (
                          <SelectItem key={network.name} value={network.name}>
                            {liquidityService.getNetworkIcon(network.name)} {network.name.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-zinc-300 text-sm">Ordenar por</Label>
                    <Select value={selectedSortBy} onValueChange={setSelectedSortBy}>
                      <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tvl">TVL</SelectItem>
                        <SelectItem value="apy">APY</SelectItem>
                        <SelectItem value="volume_usd">Volume 24h</SelectItem>
                        <SelectItem value="fees_24h">Taxas 24h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-zinc-300 text-sm">Buscar Token</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                      <Input
                        placeholder="Ex: USDC, ETH..."
                        value={searchToken}
                        onChange={(e) => setSearchToken(e.target.value)}
                        className="bg-zinc-700 border-zinc-600 text-white pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-300 text-sm">Limite de Pools</Label>
                    <Select value="50" disabled>
                      <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 Pools</SelectItem>
                        <SelectItem value="50">50 Pools</SelectItem>
                        <SelectItem value="100">100 Pools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={applyFilters} className="w-full" disabled={isLoading}>
                      <Filter className="w-4 h-4 mr-2" />
                      {isLoading ? 'Filtrando...' : 'Filtrar'}
                    </Button>
                  </div>
                </div>

                {/* Estatísticas Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-zinc-400 text-sm">TVL Total</div>
                        <div className="text-white font-semibold">{formatCurrency(totalTvl)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-zinc-400 text-sm">Volume 24h</div>
                        <div className="text-white font-semibold">{formatCurrency(totalVolume)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-yellow-400" />
                      <div>
                        <div className="text-zinc-400 text-sm">Pools Ativos</div>
                        <div className="text-white font-semibold">{pools.length}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-zinc-400 text-sm">Melhor APY</div>
                        <div className="text-white font-semibold">
                          {opportunities.length > 0 ? formatPercentage(opportunities[0].potential_apy) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="text-zinc-400 text-sm">Taxas 24h</div>
                        <div className="text-white font-semibold">
                          {formatCurrency(pools.reduce((sum, pool) => sum + pool.fees_24h, 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-zinc-400 text-sm">APY Médio</div>
                        <div className="text-white font-semibold">
                          {pools.length > 0 ? formatPercentage(pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs para diferentes visualizações */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-zinc-800">
                    <TabsTrigger value="opportunities" className="text-zinc-300">Top Oportunidades</TabsTrigger>
                    <TabsTrigger value="pools" className="text-zinc-300">Todos os Pools</TabsTrigger>
                    <TabsTrigger value="search" className="text-zinc-300">Busca</TabsTrigger>
                    <TabsTrigger value="networks" className="text-zinc-300">Redes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="opportunities" className="space-y-4">
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                      <div className="text-white font-semibold mb-3">
                        🏆 Top Oportunidades - {selectedNetwork.toUpperCase()}
                      </div>
                      <div className="space-y-3">
                        {topOpportunities.map((opp, index) => (
                          <div key={`${opp.pool.pool_address}-${index}`} className="bg-zinc-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{liquidityService.getDexIcon(opp.pool.dex)}</span>
                                <span className="font-semibold text-white">
                                  {opp.pool.token0_symbol}/{opp.pool.token1_symbol}
                                </span>
                                <Badge className={`${getRiskColor(opp.risk_level)} text-white`}>
                                  {getRiskText(opp.risk_level)}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">Score: {opp.opportunity_score.toFixed(1)}</div>
                                <div className="text-xs text-zinc-400">{opp.pool.dex}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-zinc-400">TVL:</span>
                                <div className="text-white">{formatCurrency(opp.pool.tvl)}</div>
                              </div>
                              <div>
                                <span className="text-zinc-400">APY:</span>
                                <div className={`${getTextColor(opp.pool.apy)} ${getApyColor(opp.pool.apy)} rounded px-1`}>
                                  {formatPercentage(opp.pool.apy)}
                                </div>
                              </div>
                              <div>
                                <span className="text-zinc-400">Volume 24h:</span>
                                <div className="text-white">{formatCurrency(opp.pool.volume_24h)}</div>
                              </div>
                              <div>
                                <span className="text-zinc-400">Taxas 24h:</span>
                                <div className="text-white">{formatCurrency(opp.pool.fees_24h)}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-zinc-300">
                              💡 {opp.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pools" className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-800">
                            <TableHead className="text-white bg-blue-900">Rank</TableHead>
                            <TableHead className="text-white bg-blue-900">Pool</TableHead>
                            <TableHead className="text-white bg-blue-900">DEX</TableHead>
                            <TableHead className="text-white bg-blue-900">TVL</TableHead>
                            <TableHead className="text-white bg-blue-900">Volume 24h</TableHead>
                            <TableHead className="text-white bg-blue-900">APY</TableHead>
                            <TableHead className="text-white bg-blue-900">Taxas 24h</TableHead>
                            <TableHead className="text-white bg-blue-900">Variação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pools.map((pool, index) => (
                            <TableRow key={`${pool.pool_address}-${index}`} className="border-zinc-800">
                              <TableCell className="text-white font-semibold">{index + 1}</TableCell>
                              <TableCell className="text-white">
                                <div>
                                  <div className="font-semibold">{pool.token0_symbol}/{pool.token1_symbol}</div>
                                  <div className="text-xs text-zinc-400">{pool.network.toUpperCase()}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-white text-sm">
                                <div className="flex items-center gap-1">
                                  <span>{liquidityService.getDexIcon(pool.dex)}</span>
                                  <span>{pool.dex}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-white">{formatCurrency(pool.tvl)}</TableCell>
                              <TableCell className="text-white">{formatCurrency(pool.volume_24h)}</TableCell>
                              <TableCell className={`${getTextColor(pool.apy)} ${getApyColor(pool.apy)} rounded px-2 py-1`}>
                                {formatPercentage(pool.apy)}
                              </TableCell>
                              <TableCell className="text-white">{formatCurrency(pool.fees_24h)}</TableCell>
                              <TableCell className={`${pool.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {pool.price_change_24h >= 0 ? '+' : ''}{formatPercentage(pool.price_change_24h)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="search" className="space-y-4">
                    {searchToken ? (
                      <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                        <div className="text-white font-semibold mb-3">
                          🔍 Resultados para "{searchToken}" em {selectedNetwork.toUpperCase()}
                        </div>
                        {searchResults.length > 0 ? (
                          <div className="space-y-3">
                            {searchResults.map((pool, index) => (
                              <div key={`${pool.pool_address}-${index}`} className="bg-zinc-800 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{liquidityService.getDexIcon(pool.dex)}</span>
                                    <span className="font-semibold text-white">
                                      {pool.token0_symbol}/{pool.token1_symbol}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white font-semibold">{pool.dex}</div>
                                    <div className="text-xs text-zinc-400">{pool.network.toUpperCase()}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  <div>
                                    <span className="text-zinc-400">TVL:</span>
                                    <div className="text-white">{formatCurrency(pool.tvl)}</div>
                                  </div>
                                  <div>
                                    <span className="text-zinc-400">APY:</span>
                                    <div className={`${getTextColor(pool.apy)} ${getApyColor(pool.apy)} rounded px-1`}>
                                      {formatPercentage(pool.apy)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-zinc-400">Volume 24h:</span>
                                    <div className="text-white">{formatCurrency(pool.volume_24h)}</div>
                                  </div>
                                  <div>
                                    <span className="text-zinc-400">Variação:</span>
                                    <div className={`${pool.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {pool.price_change_24h >= 0 ? '+' : ''}{formatPercentage(pool.price_change_24h)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-zinc-400 text-center py-8">
                            Nenhum pool encontrado para "{searchToken}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-zinc-400 text-center py-8">
                        Digite um token para buscar pools de liquidez
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="networks" className="space-y-4">
                    <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                      <div className="text-white font-semibold mb-3">
                        🌐 Análise por Rede - Comparativo Completo
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800">
                              <TableHead className="text-white bg-purple-900">Rede</TableHead>
                              <TableHead className="text-white bg-purple-900">TVL Total</TableHead>
                              <TableHead className="text-white bg-purple-900">Volume 24h</TableHead>
                              <TableHead className="text-white bg-purple-900">Pools</TableHead>
                              <TableHead className="text-white bg-purple-900">Melhor APY</TableHead>
                              <TableHead className="text-white bg-purple-900">APY Médio</TableHead>
                              <TableHead className="text-white bg-purple-900">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {networks.map((network) => {
                              const networkPools = pools.filter(pool => pool.network === network.name);
                              const bestApy = networkPools.length > 0 ? Math.max(...networkPools.map(p => p.apy)) : 0;
                              const avgApy = networkPools.length > 0 ? networkPools.reduce((sum, p) => sum + p.apy, 0) / networkPools.length : 0;
                              const totalVolume = networkPools.reduce((sum, p) => sum + p.volume_24h, 0);
                              
                              return (
                                <TableRow key={network.name} className="border-zinc-800">
                                  <TableCell className="text-white">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{liquidityService.getNetworkIcon(network.name)}</span>
                                      <span className="font-semibold">{network.name.toUpperCase()}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-white">{formatCurrency(network.tvl)}</TableCell>
                                  <TableCell className="text-white">{formatCurrency(totalVolume)}</TableCell>
                                  <TableCell className="text-white">{networkPools.length}</TableCell>
                                  <TableCell className="text-white">
                                    {bestApy > 0 ? (
                                      <span className={`${getTextColor(bestApy)} ${getApyColor(bestApy)} rounded px-2 py-1`}>
                                        {formatPercentage(bestApy)}
                                      </span>
                                    ) : '—'}
                                  </TableCell>
                                  <TableCell className="text-white">
                                    {avgApy > 0 ? (
                                      <span className={`${getTextColor(avgApy)} ${getApyColor(avgApy)} rounded px-2 py-1`}>
                                        {formatPercentage(avgApy)}
                                      </span>
                                    ) : '—'}
                                  </TableCell>
                                  <TableCell className="text-white">
                                    <Badge className={networkPools.length > 0 ? "bg-green-600" : "bg-gray-600"}>
                                      {networkPools.length > 0 ? "Ativo" : "Inativo"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>



                {/* Nota explicativa */}
                <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300">
                  <div className="font-semibold mb-1">💡 Como funciona o Yield Farming em Pools de Liquidez:</div>
                  <div>1. Forneça liquidez para pares de tokens • 2. Receba taxas de trading como recompensa • 3. Ganhe tokens adicionais através de incentivos</div>
                  <div className="mt-2">
                    <span className="text-green-400">Verde:</span> APY alto (20%+) • 
                    <span className="text-yellow-400"> Amarelo:</span> APY médio (15-20%) • 
                    <span className="text-orange-400"> Laranja:</span> APY baixo (10-15%) • 
                    <span className="text-red-400"> Vermelho:</span> APY muito baixo (10%-)
                  </div>
                  <div className="mt-2 text-xs">
                    <strong>Estratégia:</strong> Diversifique entre diferentes redes e DEXes para maximizar retornos e minimizar riscos.
                  </div>
                  <div className="mt-2 text-xs">
                    <strong>Novas Funcionalidades:</strong> • 30+ pools em 11 redes • Filtros avançados • Análise comparativa • Score de oportunidade • Atualização automática
                  </div>
                  

                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
