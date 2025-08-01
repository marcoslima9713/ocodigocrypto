import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChartDataPoint {
  date: string;
  value: number;
  invested: number;
}

interface PortfolioChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

const timeFilters = [
  { label: '24H', days: 1 },
  { label: '1S', days: 7 }, // 1 Semana
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1A', days: 365 },
  { label: '3A', days: 1095 },
  { label: '5A', days: 1825 },
  { label: 'Total', days: 0 }
];

export function PortfolioChart({ data, loading = false }: PortfolioChartProps) {
  const [selectedFilter, setSelectedFilter] = useState(timeFilters.length - 1); // Total por padrão

  // Calcula lucro/prejuízo (PNL) para cada ponto de dados
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(point => ({
      ...point,
      pnl: point.value - point.invested
    }));
  }, [data]);

  // Aplica filtro de período
  const filteredData = useMemo(() => {
    if (processedData.length === 0) return [];

    const now = new Date();
    const filterDays = timeFilters[selectedFilter].days;

    let filtered = processedData;

    if (filterDays > 0) {
      const cutoffDate = new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000);
      filtered = processedData.filter(point => new Date(point.date) >= cutoffDate);
    }

    // Caso não haja dados suficientes para o filtro selecionado, usar todos
    if (filtered.length === 0) {
      filtered = processedData;
    }

    return filtered;
  }, [processedData, selectedFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const calculatePerformance = () => {
    if (filteredData.length < 2) return { percentage: 0, absolute: 0 };

    const firstPnl = filteredData[0].pnl;
    const lastPnl = filteredData[filteredData.length - 1].pnl;

    const absolute = lastPnl - firstPnl;
    const percentage = firstPnl !== 0 ? (absolute / Math.abs(firstPnl)) * 100 : 0;

    return { percentage, absolute };
  };

  const performance = calculatePerformance();

  // Cor do gráfico baseada no PNL mais recente
  const pnlColor = filteredData.length > 0 && filteredData[filteredData.length - 1].pnl < 0 ? '#ef4444' : '#10b981';

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Performance do Portfólio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-zinc-400">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Performance do Portfólio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-zinc-400">Nenhum dado disponível</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Performance do Portfólio</CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={performance.percentage >= 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {performance.percentage >= 0 ? '+' : ''}{performance.percentage.toFixed(2)}%
            </Badge>
            <span className="text-sm text-zinc-400">
              {formatCurrency(performance.absolute)}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1">
          {timeFilters.map((filter, index) => (
            <Button
              key={filter.label}
              variant={selectedFilter === index ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(index)}
              className="text-xs h-8 px-3"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={pnlColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={pnlColor} stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb'
              }}
              formatter={(value: number) => [formatCurrency(value), 'Lucro/Prejuízo']}
              labelFormatter={(label) => formatDate(label)}
            />

            <Area
              type="monotone"
              dataKey="pnl"
              stroke={pnlColor}
              fillOpacity={1}
              fill="url(#colorPnl)"
              strokeWidth={2}
              name="Lucro / Prejuízo"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 