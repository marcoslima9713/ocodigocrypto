import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Clock, RefreshCw, Bitcoin, Ethereum, Shield, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { binanceService } from '@/services/binanceService';
import { CorrelationService, PairData } from '@/services/correlationService';
import { hedgeService, HedgeData, HedgeRatio, HedgePosition } from '@/services/hedgeService';
import HedgeChart from '@/components/HedgeChart';
import HedgeTable from '@/components/HedgeTable';
import HedgePanel from '@/components/HedgePanel';

// Pares estratégicos de trading baseados em correlações de mercado
const PAIRS = [
  // Par clássico - os dois maiores do mercado
  { symbolA: 'BTCUSDT', symbolB: 'ETHUSDT', nameA: 'BTC', nameB: 'ETH', description: 'Par clássico cripto' },
  
  // Bitcoin vs Layer 1s
  { symbolA: 'BTCUSDT', symbolB: 'BNBUSDT', nameA: 'BTC', nameB: 'BNB', description: 'BTC vs BNB Chain' },
  { symbolA: 'BTCUSDT', symbolB: 'SOLUSDT', nameA: 'BTC', nameB: 'SOL', description: 'BTC vs Solana' },
  { symbolA: 'BTCUSDT', symbolB: 'AVAXUSDT', nameA: 'BTC', nameB: 'AVAX', description: 'BTC vs Avalanche' },
  
  // Ethereum Ecosystem - Staking
  { symbolA: 'ETHUSDT', symbolB: 'LDOUSDT', nameA: 'ETH', nameB: 'LDO', description: 'Staking líquido' },
  { symbolA: 'ETHUSDT', symbolB: 'RPLUSDT', nameA: 'ETH', nameB: 'RPL', description: 'Staking alternativo' },
  
  // Ethereum Ecosystem - Empréstimos DeFi
  { symbolA: 'ETHUSDT', symbolB: 'AAVEUSDT', nameA: 'ETH', nameB: 'AAVE', description: 'Empréstimos DeFi' },
  { symbolA: 'ETHUSDT', symbolB: 'COMPUSDT', nameA: 'ETH', nameB: 'COMP', description: 'Empréstimos Comp' },
  
  // Ethereum Ecosystem - DEXs
  { symbolA: 'ETHUSDT', symbolB: 'UNIUSDT', nameA: 'ETH', nameB: 'UNI', description: 'DEX líder' },
  { symbolA: 'ETHUSDT', symbolB: 'SUSHIUSDT', nameA: 'ETH', nameB: 'SUSHI', description: 'DEX concorrente' },
  
  // Ethereum Ecosystem - Derivativos e Estáveis
  { symbolA: 'ETHUSDT', symbolB: 'SNXUSDT', nameA: 'ETH', nameB: 'SNX', description: 'Derivativos' },
  { symbolA: 'ETHUSDT', symbolB: 'MKRUSDT', nameA: 'ETH', nameB: 'MKR', description: 'Estável/DAI' },
  
  // BNB Chain Ecosystem
  { symbolA: 'BNBUSDT', symbolB: 'CAKEUSDT', nameA: 'BNB', nameB: 'CAKE', description: 'DEX BNB Chain' },
  
  // Solana Ecosystem
  { symbolA: 'SOLUSDT', symbolB: 'RAYUSDT', nameA: 'SOL', nameB: 'RAY', description: 'DEX Solana' },
  { symbolA: 'SOLUSDT', symbolB: 'SRMUSDT', nameA: 'SOL', nameB: 'SRM', description: 'Liquidez Solana' },
  
  // Avalanche Ecosystem
  { symbolA: 'AVAXUSDT', symbolB: 'JOEUSDT', nameA: 'AVAX', nameB: 'JOE', description: 'DEX Avalanche' },
  
  // Polygon Ecosystem
  { symbolA: 'MATICUSDT', symbolB: 'QUICKUSDT', nameA: 'MATIC', nameB: 'QUICK', description: 'DEX Polygon' },
  
  // Pares adicionais estratégicos
  { symbolA: 'ETHUSDT', symbolB: 'ADAUSDT', nameA: 'ETH', nameB: 'ADA', description: 'Smart Contracts' }
];

const Z_THRESHOLD = 2.0;
const DAYS = 30;

type Timeframe = '1h' | '4h' | 'daily' | 'weekly';

export default function CorrelationPairsPage() {
  const navigate = useNavigate();
  const [pairsData, setPairsData] = useState<PairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('daily');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>('correlation');

  // Estados para o hedge
  const [hedgeData, setHedgeData] = useState<HedgeData[]>([]);
  const [hedgeRatio, setHedgeRatio] = useState<HedgeRatio>({ beta: 0, rSquared: 0, correlation: 0, lastUpdate: new Date().toISOString() });
  const [isLoadingHedge, setIsLoadingHedge] = useState(false);
  const [allPairsHedge, setAllPairsHedge] = useState<Array<{
    pair: string;
    hedgeRatio: number;
    correlation: number;
    rSquared: number;
    recommendation: string;
  }>>([]);

  // Função para buscar e calcular dados de todos os pares
  const fetchAllPairsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pairsResults = await Promise.all(
        PAIRS.map(async (pair) => {
          try {
            // Busca dados multi-timeframe para ambos os símbolos
            const [dataA, dataB] = await Promise.all([
              binanceService.getMultiTimeframeData(pair.symbolA, DAYS),
              binanceService.getMultiTimeframeData(pair.symbolB, DAYS)
            ]);

            // Calcula dados do par
            const pairData = await CorrelationService.calculatePairData(
              pair.symbolA,
              pair.symbolB,
              pair.nameA,
              pair.nameB,
              dataA,
              dataB,
              Z_THRESHOLD,
              pair.description
            );

            return pairData;
          } catch (error) {
            console.warn(`Erro ao processar par ${pair.symbolA}/${pair.symbolB}:`, error);
            return null;
          }
        })
      );

      // Filtra pares válidos e ordena por descorrelação do timeframe selecionado
      const validPairs = pairsResults.filter(pair => pair !== null) as PairData[];
      
      validPairs.sort((a, b) => {
        const aValue = a[selectedTimeframe === 'daily' ? 'daily' : selectedTimeframe];
        const bValue = b[selectedTimeframe === 'daily' ? 'daily' : selectedTimeframe];
        return bValue - aValue;
      });

      setPairsData(validPairs);
      setLastUpdate(new Date());
    } catch (error) {
      setError('Erro ao carregar dados dos pares');
      console.error('Erro ao buscar dados dos pares:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  // Carregar dados de hedge para todos os pares
  const loadHedgeData = async () => {
    setIsLoadingHedge(true);
    try {
      // Carregar dados BTC/ETH
      const data = await hedgeService.getHistoricalData(30);
      const ratio = hedgeService.calculateHedgeRatio(data);
      
      setHedgeData(data);
      setHedgeRatio(ratio);

      // Calcular hedge para todos os pares ativos
      if (pairsData.length > 0) {
        const allPairsHedgeData = await hedgeService.calculateHedgeForAllPairs(pairsData);
        setAllPairsHedge(allPairsHedgeData.pairHedges);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de hedge:', error);
    } finally {
      setIsLoadingHedge(false);
    }
  };

  // Calcular posição hedge
  const calculateHedgePosition = (btcPosition: number): HedgePosition => {
    return hedgeService.calculateHedgePosition(btcPosition, hedgeRatio);
  };

  // Atualizar dados periodicamente
  useEffect(() => {
    fetchAllPairsData();
    loadHedgeData();
    
    const interval = setInterval(() => {
      fetchAllPairsData();
      loadHedgeData();
    }, 5 * 60 * 1000); // 5 minutos
    return () => clearInterval(interval);
  }, [fetchAllPairsData]);

  // Função para obter cor baseada no valor
  const getColor = (value: number): string => {
    if (isNaN(value) || value === 0) return 'bg-gray-700';
    if (value <= 0.25) return 'bg-green-600';
    if (value <= 0.5) return 'bg-yellow-600';
    if (value <= 0.75) return 'bg-orange-600';
    return 'bg-red-600';
  };

  // Função para obter cor do texto
  const getTextColor = (value: number): string => {
    if (isNaN(value) || value === 0) return 'text-gray-400';
    return (value > 0.25 && value <= 0.5) ? 'text-black' : 'text-white';
  };

  // Função para formatar valor
  const formatValue = (value: number): string => {
    if (isNaN(value) || value === 0) return '—';
    return (value * 100).toFixed(2);
  };

  // Função para formatar Z-Score
  const formatZScore = (value: number): string => {
    if (isNaN(value) || value === 0) return '—';
    return value.toFixed(2);
  };

  // Pares com sinais ativos para exibição especial
  const activeSignals = pairsData.filter(pair => pair.signal === 'LONG' || pair.signal === 'SHORT');
  const topPair = pairsData.length > 0 ? pairsData[0] : null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-zinc-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button 
                variant={selectedTimeframe === '1h' ? "default" : "outline"} 
                onClick={() => setSelectedTimeframe('1h')}
                className="text-sm"
              >
                1H
              </Button>
              <Button 
                variant={selectedTimeframe === '4h' ? "default" : "outline"} 
                onClick={() => setSelectedTimeframe('4h')}
                className="text-sm"
              >
                4H
              </Button>
              <Button 
                variant={selectedTimeframe === 'daily' ? "default" : "outline"} 
                onClick={() => setSelectedTimeframe('daily')}
                className="text-sm"
              >
                Diário
              </Button>
              <Button 
                variant={selectedTimeframe === 'weekly' ? "default" : "outline"} 
                onClick={() => setSelectedTimeframe('weekly')}
                className="text-sm"
              >
                Semanal
              </Button>
            </div>
            
            <Button 
              onClick={fetchAllPairsData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Máquina de Alavancagem
              <Badge variant="outline" className="ml-2">
                <Clock className="w-3 h-3 mr-1" />
                {selectedTimeframe.toUpperCase()}
              </Badge>
            </CardTitle>
            <div className="text-zinc-400 text-sm">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Carregando dados dos pares...
              </div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : pairsData.length === 0 ? (
              <div className="text-zinc-400 text-center py-8">
                Carregando dados dos pares...
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                  <TabsTrigger value="correlation" className="text-zinc-300">Correlação de Pares</TabsTrigger>
                  <TabsTrigger value="hedge" className="text-zinc-300">Hedge BTC/ETH</TabsTrigger>
                  <TabsTrigger value="spreadsheet" className="text-zinc-300">Planilha</TabsTrigger>
                </TabsList>

                <TabsContent value="correlation" className="space-y-6">
                                 {/* Informações de Ordens Ativas */}
                 <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                   <div className="text-white font-semibold mb-2">
                     Sinais Ativos ({selectedTimeframe.toUpperCase()}) - {activeSignals.length} pares
                   </div>
                   {activeSignals.length > 0 ? (
                     <div className="space-y-2">
                       {activeSignals.slice(0, 3).map((pair, index) => (
                         <div key={`${pair.symbolA}-${pair.symbolB}-${index}`} className="text-zinc-300 text-sm">
                           <div className="flex items-center justify-between">
                             <span className="font-semibold">{pair.nameA} / {pair.nameB}</span>
                             <span className="text-xs text-zinc-400">{pair.description}</span>
                           </div>
                           <div className="text-zinc-400 text-xs mt-1">
                             {pair.signal === 'LONG' ? (
                               <>
                                 <span className="text-green-400">COMPRAR {pair.nameA}</span> • 
                                 <span className="text-red-400"> VENDER {pair.nameB}</span> • 
                                 Z: {formatZScore(pair.zScore)} • 
                                 Desc: {formatValue(pair[selectedTimeframe])}%
                               </>
                             ) : (
                               <>
                                 <span className="text-red-400">VENDER {pair.nameA}</span> • 
                                 <span className="text-green-400"> COMPRAR {pair.nameB}</span> • 
                                 Z: {formatZScore(pair.zScore)} • 
                                 Desc: {formatValue(pair[selectedTimeframe])}%
                               </>
                             )}
                           </div>
                         </div>
                       ))}
                       {activeSignals.length > 3 && (
                         <div className="text-zinc-400 text-xs mt-2">
                           +{activeSignals.length - 3} outros sinais ativos
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="text-zinc-400 text-sm">
                       Nenhum sinal ativo no momento • Z-threshold: {Z_THRESHOLD}
                     </div>
                   )}
                 </div>

                                 {/* Tabela de Pares - Lista única */}
                 <div className="overflow-x-auto">
                   <Table>
                     <TableHeader>
                       <TableRow className="border-zinc-800">
                         <TableHead className="text-white bg-blue-900">Rank</TableHead>
                         <TableHead className="text-white bg-blue-900">Par</TableHead>
                         <TableHead className="text-white bg-blue-900">Descrição</TableHead>
                         <TableHead className="text-white bg-blue-900">1H</TableHead>
                         <TableHead className="text-white bg-blue-900">4H</TableHead>
                         <TableHead className="text-white bg-blue-900">Diário</TableHead>
                         <TableHead className="text-white bg-blue-900">Semanal</TableHead>
                         <TableHead className="text-white bg-blue-900">Z-Score</TableHead>
                         <TableHead className="text-white bg-blue-900">Sinal</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {pairsData && pairsData.length > 0 ? pairsData.map((pair, index) => (
                         <TableRow key={`${pair.symbolA}-${pair.symbolB}-${index}`} className="border-zinc-800">
                           <TableCell className="text-white font-semibold">{index + 1}</TableCell>
                           <TableCell className="text-white">
                             <div>
                               <div className="font-semibold">{pair.nameA} / {pair.nameB}</div>
                               <div className="text-xs text-zinc-400">{pair.symbolA} / {pair.symbolB}</div>
                             </div>
                           </TableCell>
                           <TableCell className="text-white text-sm">
                             {pair.description || '—'}
                           </TableCell>
                           <TableCell className={`${getTextColor(pair.h1)} ${getColor(pair.h1)} rounded px-2 py-1`}>
                             {formatValue(pair.h1)}%
                           </TableCell>
                           <TableCell className={`${getTextColor(pair.h4)} ${getColor(pair.h4)} rounded px-2 py-1`}>
                             {formatValue(pair.h4)}%
                           </TableCell>
                           <TableCell className={`${getTextColor(pair.daily)} ${getColor(pair.daily)} rounded px-2 py-1`}>
                             {formatValue(pair.daily)}%
                           </TableCell>
                           <TableCell className={`${getTextColor(pair.weekly)} ${getColor(pair.weekly)} rounded px-2 py-1`}>
                             {formatValue(pair.weekly)}%
                           </TableCell>
                           <TableCell className={`${getTextColor(Math.abs(pair.zScore) / 3)} ${getColor(Math.abs(pair.zScore) / 3)} rounded px-2 py-1`}>
                             {formatZScore(pair.zScore)}
                           </TableCell>
                           <TableCell>
                             {pair.signal === 'LONG' ? (
                               <Badge className="bg-green-600 text-white">
                                 <TrendingUp className="w-3 h-3 mr-1" />
                                 LONG
                               </Badge>
                             ) : pair.signal === 'SHORT' ? (
                               <Badge className="bg-red-600 text-white">
                                 <TrendingDown className="w-3 h-3 mr-1" />
                                 SHORT
                               </Badge>
                             ) : (
                               <Badge className="bg-gray-600 text-white">
                                 <Minus className="w-3 h-3 mr-1" />
                                 —
                               </Badge>
                             )}
                           </TableCell>
                         </TableRow>
                       )) : (
                         <TableRow>
                           <TableCell colSpan={9} className="text-center text-zinc-400 py-8">
                             Nenhum dado disponível
                           </TableCell>
                         </TableRow>
                       )}
                     </TableBody>
                   </Table>
                 </div>

                                 {/* Nota explicativa */}
                 <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300">
                   <div className="font-semibold mb-1">Como interpretar:</div>
                   <div>LONG = Comprar A / Vender B • SHORT = Vender A / Comprar B • Z-thr = {Z_THRESHOLD}</div>
                   <div className="mt-2">
                     <span className="text-green-400">Verde:</span> Baixa correlação (0-25%) • 
                     <span className="text-yellow-400"> Amarelo:</span> Média correlação (25-50%) • 
                     <span className="text-orange-400"> Laranja:</span> Alta correlação (50-75%) • 
                     <span className="text-red-400"> Vermelho:</span> Muito alta correlação (75%+)
                   </div>
                   <div className="mt-2 text-xs">
                     <strong>Categorias:</strong> BTC vs Layer 1s • ETH Staking • ETH DeFi • ETH DEXs • ETH Derivativos • Ecossistemas
                   </div>
                   <div className="mt-2 text-xs">
                     <strong>Estratégia:</strong> Pares com alta descorrelação e Z-Score significativo indicam oportunidades de arbitragem estatística.
                   </div>
                   
                                       <div className="mt-4 pt-3 border-t border-zinc-700">
                      <div className="font-semibold mb-1">🛡️ Hedge para Todos os Pares - Nova Funcionalidade:</div>
                      <div className="text-xs space-y-1">
                        <div>• <strong>Hedge Ratio (β):</strong> Calculado via regressão linear para cada par de ativos</div>
                        <div>• <strong>Dados Reais:</strong> Preços obtidos da API da Binance em tempo real</div>
                        <div>• <strong>Planilha Completa:</strong> Dados históricos com hedge ratios para todos os pares ativos</div>
                        <div>• <strong>Gráfico de Dispersão:</strong> Visualização da correlação BTC/ETH com linha de regressão</div>
                        <div>• <strong>Painel Dinâmico:</strong> Hedge ratios atualizados em tempo real com calculadora de posições</div>
                        <div>• <strong>Exportação:</strong> Dados exportáveis em CSV para uso em planilhas externas</div>
                      </div>
                    </div>
                 </div>

                                 {/* Estatísticas */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                   <div className="bg-zinc-800 rounded-lg p-3">
                     <div className="text-zinc-400">Total de Pares</div>
                     <div className="text-white font-semibold">{pairsData.length}/18</div>
                   </div>
                   <div className="bg-zinc-800 rounded-lg p-3">
                     <div className="text-zinc-400">Sinais Ativos</div>
                     <div className="text-white font-semibold">
                       {pairsData ? pairsData.filter(p => p.signal !== '—').length : 0}
                     </div>
                   </div>
                   <div className="bg-zinc-800 rounded-lg p-3">
                     <div className="text-zinc-400">Melhor Desc.</div>
                     <div className="text-white font-semibold">
                       {topPair ? formatValue(topPair[selectedTimeframe]) + '%' : '—'}
                     </div>
                   </div>
                   <div className="bg-zinc-800 rounded-lg p-3">
                     <div className="text-zinc-400">Categorias</div>
                     <div className="text-white font-semibold">6</div>
                   </div>
                 </div>
                </TabsContent>

                <TabsContent value="hedge" className="space-y-6">
                  {isLoadingHedge ? (
                    <div className="text-zinc-400 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Carregando dados de hedge para todos os pares...
                    </div>
                  ) : (
                    <>
                      {/* Painel de Hedge Ratio Dinâmico - BTC/ETH */}
                      <HedgePanel 
                        hedgeRatio={hedgeRatio} 
                        onCalculatePosition={calculateHedgePosition} 
                      />
                      
                      {/* Gráfico de Dispersão - BTC/ETH */}
                      <HedgeChart data={hedgeData} hedgeRatio={hedgeRatio} />

                      {/* Tabela de Hedge para Todos os Pares */}
                      <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-400" />
                            Hedge Ratios para Todos os Pares Ativos
                            <Badge variant="outline" className="ml-2">
                              {allPairsHedge.length} pares
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-zinc-800">
                                  <TableHead className="text-white bg-purple-900">Par</TableHead>
                                  <TableHead className="text-white bg-purple-900">Hedge Ratio (β)</TableHead>
                                  <TableHead className="text-white bg-purple-900">Correlação</TableHead>
                                  <TableHead className="text-white bg-purple-900">R²</TableHead>
                                  <TableHead className="text-white bg-purple-900">Recomendação</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allPairsHedge.map((hedge, index) => (
                                  <TableRow key={index} className="border-zinc-800 hover:bg-zinc-800">
                                    <TableCell className="text-white font-semibold">
                                      {hedge.pair}
                                    </TableCell>
                                    <TableCell className="text-white font-mono">
                                      {hedge.hedgeRatio.toFixed(3)}
                                    </TableCell>
                                    <TableCell className="text-white font-mono">
                                      {(hedge.correlation * 100).toFixed(1)}%
                                    </TableCell>
                                    <TableCell className="text-white font-mono">
                                      {(hedge.rSquared * 100).toFixed(1)}%
                                    </TableCell>
                                    <TableCell className="text-zinc-300 text-sm">
                                      {hedge.recommendation}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {allPairsHedge.length === 0 && (
                            <div className="text-zinc-400 text-center py-8">
                              Nenhum dado de hedge disponível
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="spreadsheet" className="space-y-6">
                  {isLoadingHedge ? (
                    <div className="text-zinc-400 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Carregando dados da planilha...
                    </div>
                  ) : (
                    <>
                      {/* Planilha BTC/ETH */}
                      <HedgeTable data={hedgeData} hedgeRatio={hedgeRatio} />
                      
                      {/* Planilha de Hedge para Todos os Pares */}
                      <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                            Planilha de Hedge para Todos os Pares
                            <Badge variant="outline" className="ml-2">
                              {allPairsHedge.length} pares
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-zinc-800">
                                  <TableHead className="text-white bg-purple-900">Par</TableHead>
                                  <TableHead className="text-white bg-purple-900">Hedge Ratio (β)</TableHead>
                                  <TableHead className="text-white bg-purple-900">Correlação (%)</TableHead>
                                  <TableHead className="text-white bg-purple-900">R² (%)</TableHead>
                                  <TableHead className="text-white bg-purple-900">Posição Hedge</TableHead>
                                  <TableHead className="text-white bg-purple-900">Recomendação</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allPairsHedge.map((hedge, index) => (
                                  <TableRow key={index} className="border-zinc-800 hover:bg-zinc-800">
                                    <TableCell className="text-white font-semibold">
                                      {hedge.pair}
                                    </TableCell>
                                    <TableCell className="text-white font-mono">
                                      {hedge.hedgeRatio.toFixed(3)}
                                    </TableCell>
                                    <TableCell className="text-white font-mono">
                                      {(hedge.correlation * 100).toFixed(1)}%
                                    </TableCell>
                                    <TableCell className="text-white font-mono">
                                      {(hedge.rSquared * 100).toFixed(1)}%
                                    </TableCell>
                                    <TableCell className="text-white font-mono">
                                      ${(hedge.hedgeRatio * 1000).toFixed(0)}
                                    </TableCell>
                                    <TableCell className="text-zinc-300 text-sm">
                                      {hedge.recommendation}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {allPairsHedge.length === 0 && (
                            <div className="text-zinc-400 text-center py-8">
                              Nenhum dado de hedge disponível
                            </div>
                          )}
                          
                          {/* Nota explicativa */}
                          <div className="mt-4 bg-purple-900/20 border border-purple-800 rounded-lg p-3">
                            <div className="text-purple-300 text-sm font-semibold mb-2">📊 Hedge para Todos os Pares:</div>
                            <div className="text-zinc-300 text-xs space-y-1">
                              <div>• <strong>Hedge Ratio (β):</strong> Calculado via regressão linear para cada par</div>
                              <div>• <strong>Correlação:</strong> Força da relação entre os ativos do par</div>
                              <div>• <strong>R²:</strong> Qualidade do modelo de regressão</div>
                              <div>• <strong>Posição Hedge:</strong> Valor em USD para hedge de $1.000 no primeiro ativo</div>
                              <div>• <strong>Recomendação:</strong> Instrução prática para execução do hedge</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
