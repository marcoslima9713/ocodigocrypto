// Componente de Correlação e Força Relativa entre Bitcoin e S&P 500
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Activity, Target } from 'lucide-react';
import { BitcoinService, BitcoinData } from '@/services/bitcoinService';
import { SP500Service, SP500Data } from '@/services/sp500Service';
import CorrelationChart from './CorrelationChart';

interface CorrelationData {
  correlation: number;
  relativeStrength: number;
  btcPerformance: number;
  sp500Performance: number;
  period: number;
  lastUpdate: Date;
}

export default function CorrelationIndicator() {
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<number>(50);

  useEffect(() => {
    calculateCorrelation();
  }, [period]);

  const calculateCorrelation = async () => {
    setIsLoading(true);
    try {
      // Buscar dados históricos
      const btcData = await BitcoinService.getHistoricalData(10);
      const sp500Data = await SP500Service.getHistoricalData(10);

      // Calcular correlação e força relativa
      const correlation = calculateCorrelationValue(btcData, sp500Data, period);
      const relativeStrength = calculateRelativeStrength(btcData, sp500Data, 20);
      const btcPerformance = calculatePerformance(btcData, 20);
      const sp500Performance = calculatePerformance(sp500Data, 20);

      setCorrelationData({
        correlation,
        relativeStrength,
        btcPerformance,
        sp500Performance,
        period,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Erro ao calcular correlação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCorrelationValue = (btcData: BitcoinData, sp500Data: SP500Data, period: number): number => {
    // Coletar retornos mensais dos últimos N meses
    const btcReturns: number[] = [];
    const sp500Returns: number[] = [];

    // Pegar os últimos dados disponíveis
    const btcYears = btcData.years.slice(-Math.ceil(period / 12));
    const sp500Years = sp500Data.years.slice(-Math.ceil(period / 12));

    // Extrair retornos mensais
    btcYears.forEach(year => {
      year.monthlyReturns.forEach(return_ => {
        if (return_ !== null) btcReturns.push(return_);
      });
    });

    sp500Years.forEach(year => {
      year.monthlyReturns.forEach(return_ => {
        if (return_ !== null) sp500Returns.push(return_);
      });
    });

    // Pegar apenas os últimos N valores
    const recentBtcReturns = btcReturns.slice(-period);
    const recentSp500Returns = sp500Returns.slice(-period);

    if (recentBtcReturns.length < 2 || recentSp500Returns.length < 2) {
      return 0;
    }

    // Calcular correlação de Pearson
    return calculatePearsonCorrelation(recentBtcReturns, recentSp500Returns);
  };

  const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const calculateRelativeStrength = (btcData: BitcoinData, sp500Data: SP500Data, period: number): number => {
    const btcPerf = calculatePerformance(btcData, period);
    const sp500Perf = calculatePerformance(sp500Data, period);
    return btcPerf - sp500Perf;
  };

  const calculatePerformance = (data: BitcoinData | SP500Data, period: number): number => {
    const recentYears = data.years.slice(-Math.ceil(period / 12));
    let totalReturn = 0;
    let count = 0;

    recentYears.forEach(year => {
      year.monthlyReturns.forEach(return_ => {
        if (return_ !== null) {
          totalReturn += return_;
          count++;
        }
      });
    });

    return count > 0 ? totalReturn : 0;
  };

  const getCorrelationColor = (correlation: number): string => {
    if (correlation > 0.5) return 'text-green-400';
    if (correlation < -0.5) return 'text-red-400';
    return 'text-gray-400';
  };

  const getCorrelationBadge = (correlation: number): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (correlation > 0.7) return { text: 'Alta Correlação Positiva', variant: 'default' };
    if (correlation > 0.3) return { text: 'Correlação Positiva', variant: 'default' };
    if (correlation > -0.3) return { text: 'Baixa Correlação', variant: 'secondary' };
    if (correlation > -0.7) return { text: 'Correlação Negativa', variant: 'outline' };
    return { text: 'Alta Correlação Negativa', variant: 'destructive' };
  };

  const getRelativeStrengthColor = (strength: number): string => {
    return strength > 0 ? 'text-green-400' : 'text-red-400';
  };

  const getRelativeStrengthIcon = (strength: number) => {
    return strength > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Correlação BTC vs S&P 500
          </CardTitle>
          <CardDescription className="text-slate-400">
            Calculando correlação e força relativa...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!correlationData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Correlação BTC vs S&P 500
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-4">
            Erro ao carregar dados de correlação
          </p>
        </CardContent>
      </Card>
    );
  }

  const correlationBadge = getCorrelationBadge(correlationData.correlation);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          Correlação BTC vs S&P 500
        </CardTitle>
        <CardDescription className="text-slate-400">
          Análise de correlação e força relativa entre Bitcoin e S&P 500
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Correlação Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Correlação</h4>
              <Badge variant={correlationBadge.variant}>
                {correlationBadge.text}
              </Badge>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Valor da Correlação</span>
                <span className={`text-2xl font-bold ${getCorrelationColor(correlationData.correlation)}`}>
                  {correlationData.correlation.toFixed(3)}
                </span>
              </div>
              
              {/* Barra de correlação visual */}
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    correlationData.correlation > 0.5 ? 'bg-green-400' :
                    correlationData.correlation < -0.5 ? 'bg-red-400' : 'bg-gray-400'
                  }`}
                  style={{ 
                    width: `${Math.abs(correlationData.correlation) * 100}%`,
                    marginLeft: correlationData.correlation < 0 ? `${(1 - Math.abs(correlationData.correlation)) * 100}%` : '0%'
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-500">
                <span>-1.0</span>
                <span>0.0</span>
                <span>+1.0</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Força Relativa</h4>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">BTC vs S&P 500</span>
                <div className={`flex items-center ${getRelativeStrengthColor(correlationData.relativeStrength)}`}>
                  {getRelativeStrengthIcon(correlationData.relativeStrength)}
                  <span className="ml-2 text-lg font-bold">
                    {correlationData.relativeStrength > 0 ? '+' : ''}{correlationData.relativeStrength.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bitcoin (20 períodos):</span>
                  <span className="text-white">{correlationData.btcPerformance.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">S&P 500 (20 períodos):</span>
                  <span className="text-white">{correlationData.sp500Performance.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretação */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <h5 className="text-blue-200 font-semibold mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Interpretação
          </h5>
          <div className="text-blue-200 text-sm space-y-2">
            {correlationData.correlation > 0.7 && (
              <p>• <strong>Alta correlação positiva:</strong> Bitcoin e S&P 500 tendem a se mover na mesma direção</p>
            )}
            {correlationData.correlation > 0.3 && correlationData.correlation <= 0.7 && (
              <p>• <strong>Correlação positiva moderada:</strong> Alguma relação positiva entre os ativos</p>
            )}
            {correlationData.correlation >= -0.3 && correlationData.correlation <= 0.3 && (
              <p>• <strong>Baixa correlação:</strong> Bitcoin e S&P 500 se movem independentemente</p>
            )}
            {correlationData.correlation >= -0.7 && correlationData.correlation < -0.3 && (
              <p>• <strong>Correlação negativa:</strong> Tendência de movimento em direções opostas</p>
            )}
            {correlationData.correlation < -0.7 && (
              <p>• <strong>Alta correlação negativa:</strong> Bitcoin e S&P 500 se movem em direções opostas</p>
            )}
            
            {correlationData.relativeStrength > 0 ? (
              <p>• <strong>Bitcoin está mais forte:</strong> Performance superior ao S&P 500 no período</p>
            ) : (
              <p>• <strong>S&P 500 está mais forte:</strong> Performance superior ao Bitcoin no período</p>
            )}
          </div>
        </div>

        {/* Informações técnicas */}
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Período de correlação: {correlationData.period} meses</span>
          <span>Última atualização: {correlationData.lastUpdate.toLocaleTimeString('pt-BR')}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal que combina indicador e gráfico
export function CorrelationIndicatorWithChart() {
  return (
    <div className="space-y-6">
      <CorrelationIndicator />
      <CorrelationChart />
    </div>
  );
}
