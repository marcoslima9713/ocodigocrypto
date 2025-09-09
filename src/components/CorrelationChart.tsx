// Componente de Gráfico de Correlação BTC vs S&P 500
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, Activity } from 'lucide-react';
import { CorrelationService, CorrelationChartData, CorrelationDataPoint } from '@/services/correlationService';

interface CorrelationChartProps {
  className?: string;
}

export default function CorrelationChart({ className }: CorrelationChartProps) {
  const [chartData, setChartData] = useState<CorrelationChartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(50);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const periodOptions = [
    { value: 24, label: '4 dias (24 períodos)' },
    { value: 50, label: '8 dias (50 períodos)' },
    { value: 100, label: '17 dias (100 períodos)' },
    { value: 200, label: '33 dias (200 períodos)' },
    { value: 500, label: '83 dias (500 períodos)' }
  ];

  useEffect(() => {
    loadChartData();
  }, [selectedPeriod]);

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const data = await CorrelationService.getCorrelationData(selectedPeriod);
      setChartData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadChartData();
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'correlation') {
      return [`${value.toFixed(3)}`, 'Correlação'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  };

  const getCorrelationColor = (value: number): string => {
    if (value > 0.5) return '#10b981'; // green-500
    if (value < -0.5) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  };

  const getCurrentCorrelation = (): number => {
    if (!chartData || chartData.data.length === 0) return 0;
    return chartData.data[chartData.data.length - 1].correlation;
  };

  const getCorrelationStatus = (correlation: number): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (correlation > 0.7) return { text: 'Alta Correlação Positiva', variant: 'default' };
    if (correlation > 0.3) return { text: 'Correlação Positiva', variant: 'default' };
    if (correlation > -0.3) return { text: 'Baixa Correlação', variant: 'secondary' };
    if (correlation > -0.7) return { text: 'Correlação Negativa', variant: 'outline' };
    return { text: 'Alta Correlação Negativa', variant: 'destructive' };
  };

  if (isLoading) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Gráfico de Correlação BTC vs S&P 500
          </CardTitle>
          <CardDescription className="text-slate-400">
            Carregando dados de correlação...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Gráfico de Correlação BTC vs S&P 500
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">
            Erro ao carregar dados do gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentCorrelation = getCurrentCorrelation();
  const correlationStatus = getCorrelationStatus(currentCorrelation);

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              Gráfico de Correlação BTC vs S&P 500
            </CardTitle>
            <CardDescription className="text-slate-400">
              Correlação em tempo real baseada em dados de 4 horas
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={correlationStatus.variant}>
              {correlationStatus.text}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Label className="text-slate-300">Período:</Label>
            <Select value={selectedPeriod.toString()} onValueChange={(value) => setSelectedPeriod(Number(value))}>
              <SelectTrigger className="w-48 bg-slate-900 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-600">
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()} className="text-white">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Correlação Positiva</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Correlação Negativa</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Baixa Correlação</span>
            </div>
          </div>
        </div>

        {/* Estatísticas Atuais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Correlação Atual</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className={`text-2xl font-bold mt-2 ${getCorrelationColor(currentCorrelation)}`}>
              {currentCorrelation.toFixed(3)}
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Período</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">
              {selectedPeriod}
            </div>
            <div className="text-xs text-slate-500 mt-1">períodos de 4h</div>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Última Atualização</span>
              <RefreshCw className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-sm font-semibold mt-2 text-white">
              {lastUpdate.toLocaleTimeString('pt-BR')}
            </div>
            <div className="text-xs text-slate-500 mt-1">Dados de 4 horas</div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={formatXAxisLabel}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                domain={[-1, 1]}
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString('pt-BR');
                }}
                formatter={formatTooltipValue}
              />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="2 2" opacity={0.5} />
              <ReferenceLine y={-0.5} stroke="#ef4444" strokeDasharray="2 2" opacity={0.5} />
              <Line
                type="monotone"
                dataKey="correlation"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Interpretação */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <h5 className="text-blue-200 font-semibold mb-2 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Interpretação do Gráfico
          </h5>
          <div className="text-blue-200 text-sm space-y-2">
            <p>• <strong>Linha Azul:</strong> Correlação entre Bitcoin e S&P 500 ao longo do tempo</p>
            <p>• <strong>Linha Verde (0.5):</strong> Limite de alta correlação positiva</p>
            <p>• <strong>Linha Vermelha (-0.5):</strong> Limite de alta correlação negativa</p>
            <p>• <strong>Linha Cinza (0):</strong> Correlação neutra</p>
            <p>• <strong>Dados:</strong> Baseados em retornos de 4 horas para análise de curto prazo</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
