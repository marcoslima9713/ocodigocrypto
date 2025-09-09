// Página da Máquina de Alavancagem - Painel S&P 500
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Calendar, DollarSign, Target, Zap, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SP500Service, SP500Data, YearlyData } from '@/services/sp500Service';
import { BitcoinService, BitcoinData } from '@/services/bitcoinService';
import CorrelationChart from '@/components/CorrelationChart';

export default function MaquinaAlavancagemSP500() {
  const navigate = useNavigate();
  const [sp500Data, setSp500Data] = useState<SP500Data | null>(null);
  const [bitcoinData, setBitcoinData] = useState<BitcoinData | null>(null);
  const [maxYears, setMaxYears] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dataSource, setDataSource] = useState<string>('Histórico');
  const [selectedAsset, setSelectedAsset] = useState<'SP500' | 'Bitcoin'>('SP500');

  // Carregar dados do ativo selecionado
  useEffect(() => {
    loadAssetData();
  }, [maxYears, selectedAsset]);

  const loadAssetData = async () => {
    setIsLoading(true);
    try {
      if (selectedAsset === 'SP500') {
        const data = await SP500Service.getHistoricalData(maxYears);
        setSp500Data(data);
        setBitcoinData(null);
        
        // Verificar se temos dados de 2025
        const has2025Data = data.years.some(year => year.year === 2025);
        if (has2025Data) {
          setDataSource('Histórico + Tempo Real (2025)');
        }
      } else {
        const data = await BitcoinService.getHistoricalData(maxYears);
        setBitcoinData(data);
        setSp500Data(null);
        setDataSource('Histórico');
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error(`Erro ao carregar dados do ${selectedAsset}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Nomes dos meses em português
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Função para obter cor de fundo baseada no retorno
  const getBackgroundColor = (returnValue: number | null, isAverage: boolean = false) => {
    if (returnValue === null) return 'bg-gray-600';
    
    if (isAverage) {
      return returnValue >= 0 ? 'bg-green-700/70' : 'bg-red-700/70';
    }
    
    return returnValue >= 0 ? 'bg-green-600' : 'bg-red-600';
  };

  // Função para formatar retorno
  const formatReturn = (returnValue: number | null) => {
    if (returnValue === null) return '-';
    return `${returnValue.toFixed(2)}%`;
  };

  // Calcular estatísticas de performance
  const getPerformanceStats = () => {
    const data = selectedAsset === 'SP500' ? sp500Data : bitcoinData;
    if (!data) return null;
    
    const allReturns = data.years.flatMap(year => 
      year.monthlyReturns.filter(ret => ret !== null)
    );
    
    const positiveReturns = allReturns.filter(ret => ret! > 0);
    const negativeReturns = allReturns.filter(ret => ret! < 0);
    
    return {
      totalMonths: allReturns.length,
      positiveMonths: positiveReturns.length,
      negativeMonths: negativeReturns.length,
      positiveRate: (positiveReturns.length / allReturns.length) * 100,
      averageReturn: allReturns.reduce((sum, ret) => sum + ret!, 0) / allReturns.length,
      bestMonth: Math.max(...allReturns),
      worstMonth: Math.min(...allReturns)
    };
  };

  const performanceStats = getPerformanceStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Máquina de Alavancagem</h1>
                <p className="text-slate-400 text-sm sm:text-base">Análise de Retornos Mensais - S&P 500 & Bitcoin</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="asset" className="text-slate-300 text-sm">Ativo:</Label>
                <Select value={selectedAsset} onValueChange={(value: 'SP500' | 'Bitcoin') => setSelectedAsset(value)}>
                  <SelectTrigger className="w-28 sm:w-32 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="SP500">S&P 500</SelectItem>
                    <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="maxYears" className="text-slate-300 text-sm">Anos:</Label>
                <Select value={maxYears.toString()} onValueChange={(value) => setMaxYears(parseInt(value))}>
                  <SelectTrigger className="w-16 sm:w-20 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-600 text-white text-xs sm:text-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">S&P 500</span>
                <span className="sm:hidden">S&P</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAssetData}
                disabled={isLoading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Controles */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  <Calendar className="w-3 h-3 mr-1" />
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-slate-400 text-sm">
                <Info className="w-4 h-4" />
                <span>Fonte: {dataSource}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Performance */}
        {performanceStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Taxa de Meses Positivos</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-400">
                      {performanceStats.positiveRate.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Retorno Médio Mensal</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-400">
                      {performanceStats.averageReturn.toFixed(2)}%
                    </p>
                  </div>
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Melhor Mês</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-400">
                      +{performanceStats.bestMonth.toFixed(2)}%
                    </p>
                  </div>
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Pior Mês</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-400">
                      {performanceStats.worstMonth.toFixed(2)}%
                    </p>
                  </div>
                  <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela Principal - Retornos Mensais */}
        {isLoading ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mr-3" />
                <span className="text-slate-300">Carregando dados do {selectedAsset === 'SP500' ? 'S&P 500' : 'Bitcoin'}...</span>
              </div>
            </CardContent>
          </Card>
        ) : (sp500Data || bitcoinData) ? (
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
            <CardHeader className="bg-black/20 border-b border-slate-700">
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Retornos Mensais do {selectedAsset === 'SP500' ? 'S&P 500' : 'Bitcoin'} (%)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Análise histórica de performance mensal com médias acumuladas
                {selectedAsset === 'SP500' && sp500Data?.years.some(year => year.year === 2025) && (
                  <span className="text-green-400 ml-2">• Dados de 2025 em tempo real</span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="px-2 sm:px-4 py-3 text-left font-semibold border-r border-slate-600 text-xs sm:text-sm">Ano/Mês</th>
                      {monthNames.map((month, index) => (
                        <th key={index} className="px-1 sm:px-3 py-3 text-center font-semibold border-r border-slate-600 text-xs sm:text-sm">
                          {month}
                        </th>
                      ))}
                      <th className="px-2 sm:px-4 py-3 text-center font-semibold bg-blue-800 text-xs sm:text-sm">Total</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {/* Linhas dos anos */}
                    {(selectedAsset === 'SP500' ? sp500Data : bitcoinData)?.years.map((yearData, yearIndex) => (
                      <tr key={yearData.year} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="px-2 sm:px-4 py-3 text-white font-semibold bg-black border-r border-slate-600 text-xs sm:text-sm">
                          {yearData.year}
                        </td>
                        
                        {yearData.monthlyReturns.map((monthReturn, monthIndex) => (
                          <td 
                            key={monthIndex} 
                            className={`px-1 sm:px-3 py-3 text-center text-white border-r border-slate-600 text-xs sm:text-sm ${getBackgroundColor(monthReturn)}`}
                          >
                            {formatReturn(monthReturn)}
                          </td>
                        ))}
                        
                        <td className="px-2 sm:px-4 py-3 text-center text-white font-semibold bg-blue-800/80 text-xs sm:text-sm">
                          {formatReturn(yearData.totalReturn)}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Linha de médias */}
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      <td className="px-2 sm:px-4 py-3 text-white font-semibold bg-black border-r border-slate-600 text-xs sm:text-sm">
                        Média
                      </td>
                      
                      {(selectedAsset === 'SP500' ? sp500Data : bitcoinData)?.monthlyAverages.map((avgReturn, monthIndex) => (
                        <td 
                          key={monthIndex} 
                          className={`px-1 sm:px-3 py-3 text-center text-white border-r border-slate-600 text-xs sm:text-sm ${getBackgroundColor(avgReturn, true)}`}
                        >
                          {formatReturn(avgReturn)}
                        </td>
                      ))}
                      
                      <td className="px-2 sm:px-4 py-3 text-center text-white font-semibold bg-blue-800/60 text-xs sm:text-sm">
                        {formatReturn((selectedAsset === 'SP500' ? sp500Data : bitcoinData)?.monthlyAverages.reduce((sum, avg) => sum + (avg || 0), 0) || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <div className="text-center text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p>Nenhum dado disponível</p>
                <Button 
                  onClick={loadAssetData} 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Correlação BTC vs S&P 500 */}
        <div className="mt-6">
          <CorrelationChart />
        </div>

        {/* Informações Adicionais */}
        <Card className="mt-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-400" />
              Sobre a Máquina de Alavancagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3">Como Usar</h4>
                <ul className="space-y-2 text-slate-300 text-sm sm:text-base">
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Analise padrões sazonais nos retornos mensais</span>
                  </li>
                  <li className="flex items-start">
                    <Target className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Identifique os melhores meses para investir</span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Use as médias históricas para estratégias de timing</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3">Dados Utilizados</h4>
                <ul className="space-y-2 text-slate-300 text-sm sm:text-base">
                  <li className="flex items-start">
                    <DollarSign className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Dados históricos do S&P 500 desde 2014</span>
                  </li>
                  <li className="flex items-start">
                    <Calendar className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Retornos mensais calculados (fechamento - abertura)</span>
                  </li>
                  <li className="flex items-start">
                    <BarChart3 className="w-4 h-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Dados de 2025 em tempo real via Yahoo Finance</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Nota:</strong> Este painel é baseado no indicador TradingView "Retornos Mensais (%) - Estilo Coinglass + Média (FIX)" 
                e utiliza dados do repositório S&P 500 do GitHub para análise histórica de performance. Os dados de 2025 são obtidos em tempo real 
                através de APIs financeiras (Yahoo Finance) para garantir precisão e atualização constante.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
