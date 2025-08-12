import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  PieChart,
  Target,
  Zap,
  ArrowLeft,
  Users,
  Trophy,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useCryptoImages } from '@/hooks/useCryptoImages';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MonthlyReport } from '@/components/MonthlyReport';
import { SparklineChart } from '@/components/SparklineChart';
import { PortfolioDistribution } from '@/components/PortfolioDistribution';
import { ProfitLossChart } from '@/components/ProfitLossChart';
import { CommunityFeed } from '@/components/CommunityFeed';

export default function CryptoPortfolio() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { 
    totalInvested, 
    currentValue, 
    profitLoss, 
    profitLossPercentage, 
    holdings, 
    transactions, 
    loading, 
    error,
    addTransaction,
    removeTransaction,
    refetch,
    chartData
  } = usePortfolio();
  const cryptoIds = useMemo(() => 
    holdings?.map(h => h.coinGeckoId || h.crypto_symbol.toLowerCase()) || [], 
    [holdings]
  );
  const { prices, loading: pricesLoading, lastUpdated, isUpdating } = useCryptoPrices(cryptoIds);
  
  // Hook para imagens das criptomoedas
  const { getCryptoImage } = useCryptoImages();
  
  // Debug removido para evitar re-renderizações desnecessárias


  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const { toast } = useToast();

  const handleTransactionAdded = () => {
    refetch();
    toast({
      title: "Transação adicionada!",
      description: "Seu portfólio foi atualizado com sucesso.",
    });
  };

  const handleDeleteClick = (transaction: any) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };

  const handleTransactionRemoved = async () => {
    if (!transactionToDelete) return;
    
    try {
      await removeTransaction(transactionToDelete.id);
      // If no error is thrown, consider it successful
      toast({
        title: "Transação removida!",
        description: "A transação foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover transação",
        description: "Não foi possível remover a transação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getCryptoIcon = (symbol: string) => {
    return getCryptoImage(symbol) || `https://assets.coingecko.com/coins/images/1/large/${symbol.toLowerCase()}.png`;
  };

  const generateSparklineData = (symbol: string) => {
    // Simulação de dados de sparkline - em produção, buscar da API
    const coinGeckoId = symbol.toLowerCase();
    const data = [];
    for (let i = 0; i < 7; i++) {
      const basePrice = prices[coinGeckoId]?.usd || 100;
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variação
      data.push(basePrice * (1 + variation));
    }
    return data;
  };

  const getTopPerformers = () => {
    return holdings
      .map(holding => {
        const coinGeckoId = holding.coinGeckoId || holding.crypto_symbol.toLowerCase();
        const currentPrice = prices[coinGeckoId]?.usd || Number(holding.average_buy_price);
        const currentValue = Number(holding.total_amount) * currentPrice;
        
        return {
          ...holding,
          currentPrice,
          pnl: currentValue - Number(holding.total_invested),
          pnlPercentage: Number(holding.total_invested) > 0 ? ((currentValue / Number(holding.total_invested)) - 1) * 100 : 0
        };
      })
      .filter(holding => holding.pnlPercentage > 0)
      .sort((a, b) => b.pnlPercentage - a.pnlPercentage)
      .slice(0, 3);
  };

  const getWorstPerformers = () => {
    return holdings
      .map(holding => {
        const coinGeckoId = holding.coinGeckoId || holding.crypto_symbol.toLowerCase();
        const currentPrice = prices[coinGeckoId]?.usd || Number(holding.average_buy_price);
        const currentValue = Number(holding.total_amount) * currentPrice;
        
        return {
          ...holding,
          currentPrice,
          pnl: currentValue - Number(holding.total_invested),
          pnlPercentage: Number(holding.total_invested) > 0 ? ((currentValue / Number(holding.total_invested)) - 1) * 100 : 0
        };
      })
      .filter(holding => holding.pnlPercentage < 0)
      .sort((a, b) => a.pnlPercentage - b.pnlPercentage)
      .slice(0, 3);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Faça login para acessar seu portfólio</p>
          <Button onClick={() => navigate('/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando portfólio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-3 sm:p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-0">
          <div className="flex-1">
            <Link to="/dashboard" className="flex items-center text-zinc-400 hover:text-white transition-colors mb-1 sm:mb-2 text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Meu Portfólio Crypto
            </h1>
            <p className="text-zinc-400 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
              Gerencie seus investimentos em criptomoedas e acompanhe sua performance
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValues(!showValues)}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              {showValues ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
              <span className="hidden sm:inline">{showValues ? 'Ocultar' : 'Mostrar'} Valores</span>
              <span className="sm:hidden">{showValues ? 'Ocultar' : 'Mostrar'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ranking')}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ver Ranking</span>
              <span className="sm:hidden">Ranking</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
            
            <Button onClick={() => setShowAddTransaction(true)} className="text-xs sm:text-sm px-2 sm:px-3">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Adicionar Transação</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card className="border-l-4 border-l-green-400 bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">
                Total Investido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {showValues ? formatCurrency(totalInvested) : '••••••'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-400 bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">
                Valor Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {showValues ? formatCurrency(currentValue) : '••••••'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-400 bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">
                Lucro/Prejuízo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {showValues ? formatCurrency(profitLoss) : '••••••'}
              </div>
              <div className={`text-xs sm:text-sm ${profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {showValues ? formatPercentage(profitLossPercentage) : '••••••'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-400 bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">
                Total de Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {holdings.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="portfolio" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
              <PieChart className="w-4 h-4" />
              Portfólio
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
              <BarChart3 className="w-4 h-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
              <Target className="w-4 h-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
              <Calendar className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
              <Users className="w-4 h-4" />
              Comunidade
            </TabsTrigger>
          </TabsList>

          {/* Tab: Portfólio */}
          <TabsContent value="portfolio" className="space-y-6">
            {holdings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Portfólio Vazio</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Adicione sua primeira transação para começar a acompanhar seu portfólio
                  </p>
                  <Button onClick={() => setShowAddTransaction(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Transação
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Cards dos Ativos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {holdings.map((holding) => {
                    // Converter symbol para coinGeckoId para buscar preços
                    const coinGeckoId = holding.coinGeckoId || holding.crypto_symbol.toLowerCase();
                    const currentPrice = prices[coinGeckoId]?.usd || Number(holding.average_buy_price);
                    const currentValue = Number(holding.total_amount) * currentPrice;
                    
                    // P&L baseado nos dados calculados (já corretos)
                    const pnl = currentValue - Number(holding.total_invested);
                    const pnlPercentage = Number(holding.total_invested) > 0 ? ((currentValue / Number(holding.total_invested)) - 1) * 100 : 0;
                    const sparklineData = generateSparklineData(holding.crypto_symbol);



                    return (
                      <motion.div
                        key={holding.crypto_symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-zinc-900 border-zinc-800">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getCryptoIcon(holding.crypto_symbol)}
                                  alt={holding.crypto_symbol}
                                  className="w-8 h-8 rounded-full"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                                <div>
                                  <CardTitle className="text-lg font-semibold text-white">
                                    {holding.crypto_symbol}
                                  </CardTitle>
                                  <p className="text-sm text-zinc-400">
                                    {Number(holding.total_amount).toFixed(6)}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={pnl >= 0 ? "default" : "destructive"} className="bg-zinc-800 text-white border-zinc-700">
                                {formatPercentage(pnlPercentage)}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            {/* Preços */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-zinc-400">Preço Médio</p>
                                <p className="font-semibold text-white">
                                  {showValues ? formatCurrency(Number(holding.average_buy_price)) : '••••••'}
                                </p>
                              </div>
                              <div>
                                <p className="text-zinc-400">Preço Atual</p>
                                <p className="font-semibold text-white">
                                  {showValues ? formatCurrency(currentPrice) : '••••••'}
                                </p>
                              </div>
                            </div>

                            {/* Valores */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-zinc-400">Investido</p>
                                <p className="font-semibold text-white">
                                  {showValues ? formatCurrency(Number(holding.total_invested)) : '••••••'}
                                </p>
                              </div>
                              <div>
                                <p className="text-zinc-400">Valor Atual</p>
                                <p className="font-semibold text-white">
                                  {showValues ? formatCurrency(currentValue) : '••••••'}
                                </p>
                              </div>
                            </div>

                            {/* P&L */}
                            <div className="border-t border-zinc-800 pt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">P&L</span>
                                <div className="text-right">
                                  <div className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {showValues ? formatCurrency(pnl) : '••••••'}
                                  </div>
                                  <div className={`text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {showValues ? formatPercentage(pnlPercentage) : '••••'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sparkline */}
                            <div className="h-12 bg-zinc-800/50 rounded-lg p-2">
                              <SparklineChart
                                data={sparklineData}
                                width={100}
                                height={40}
                                color={pnl >= 0 ? "#10b981" : "#ef4444"}
                                className="w-full h-full"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Melhores Performances
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getTopPerformers().map((performer, index) => (
                        <div key={performer.crypto_symbol} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs bg-zinc-800 border-zinc-700 text-white">
                              {index + 1}
                            </Badge>
                            <span className="font-medium text-white">{performer.crypto_symbol}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-semibold">
                              {formatPercentage(performer.pnlPercentage)}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {formatCurrency(performer.pnl)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                        Piores Performances
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getWorstPerformers().map((performer, index) => (
                        <div key={performer.crypto_symbol} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs bg-zinc-800 border-zinc-700 text-white">
                              {index + 1}
                  </Badge>
                            <span className="font-medium text-white">{performer.crypto_symbol}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-red-400 font-semibold">
                              {formatPercentage(performer.pnlPercentage)}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {formatCurrency(performer.pnl)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab: Transações */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg bg-zinc-900 border-zinc-800">
                        <div className="flex items-center gap-4">
                          <Badge variant={transaction.transaction_type === 'buy' ? 'default' : 'secondary'} className="bg-zinc-800 text-white border-zinc-700">
                            {transaction.transaction_type === 'buy' ? 'Compra' : 'Venda'}
                          </Badge>
                          <div>
                            <div className="font-medium text-white">{transaction.crypto_symbol}</div>
                            <div className="text-sm text-zinc-400">
                              {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">
                            {Number(transaction.amount).toFixed(6)} {transaction.crypto_symbol}
                          </div>
                          <div className="text-sm text-zinc-400">
                            {formatCurrency(Number(transaction.price_usd))} cada
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">
                            {formatCurrency(Number(transaction.total_usd))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(transaction)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
          </TabsContent>

          {/* Tab: Análises */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Gráfico Principal */}
            <ProfitLossChart
              data={chartData}
              loading={loading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioDistribution
                holdings={holdings}
                currentPrices={Object.fromEntries(
                  Object.entries(prices).map(([symbol, data]) => [symbol, data.usd])
                )}
              />

              <Card className="bg-zinc-900 border-zinc-800">
                      <CardHeader>
                  <CardTitle className="text-white">Métricas de Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Total de Ativos</span>
                      <span className="font-semibold text-white">{holdings.length}</span>
                    </div>
                          <div className="flex justify-between">
                      <span className="text-zinc-300">Total de Transações</span>
                      <span className="font-semibold text-white">{transactions.length}</span>
                          </div>
                          <div className="flex justify-between">
                      <span className="text-zinc-300">Ativos em Lucro</span>
                      <span className="font-semibold text-green-400">
                        {holdings.filter(h => {
                          const coinGeckoId = h.coinGeckoId || h.crypto_symbol.toLowerCase();
                          const currentPrice = prices[coinGeckoId]?.usd || 0;
                          return currentPrice > Number(h.average_buy_price);
                        }).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                      <span className="text-zinc-300">Ativos em Prejuízo</span>
                      <span className="font-semibold text-red-400">
                        {holdings.filter(h => {
                          const coinGeckoId = h.coinGeckoId || h.crypto_symbol.toLowerCase();
                          const currentPrice = prices[coinGeckoId]?.usd || 0;
                          return currentPrice < Number(h.average_buy_price);
                        }).length}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                </div>
          </TabsContent>

          {/* Tab: Comunidade */}
          <TabsContent value="community" className="space-y-6">
            <CommunityFeed 
              enableWebSocket={false}
              showPrivacyToggle={true}
            />
          </TabsContent>

          {/* Tab: Relatórios */}
          <TabsContent value="reports" className="space-y-6">
            <MonthlyReport
              transactions={transactions}
              holdings={holdings}
              currentPrices={prices}
              selectedMonth={new Date()}
            />
          </TabsContent>
        </Tabs>
          </div>

        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
          portfolios={[{ id: 'main', name: 'Portfólio Principal' }]}
          selectedPortfolioId="main"
          onTransactionAdded={handleTransactionAdded}
        />

        {/* Delete Transaction Dialog */}
        <DeleteTransactionDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          transaction={transactionToDelete}
          onConfirm={handleTransactionRemoved}
          loading={loading}
        />
    </div>
  );
}