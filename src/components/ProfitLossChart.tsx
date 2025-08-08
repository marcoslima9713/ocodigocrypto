import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ChartDataPoint {
  date: string; // ISO yyyy-mm-dd
  value: number; // valor atual do portfolio no dia
  invested: number; // capital investido até o dia
}

interface ProfitLossChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

const timeFilters = [
  { label: '24H', days: 1 },
  { label: '1S', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1A', days: 365 },
  { label: '3A', days: 1095 },
  { label: '5A', days: 1825 },
  { label: 'Total', days: 0 }
];

export function ProfitLossChart({ data, loading = false }: ProfitLossChartProps) {
  // Começa em "Total" para dar visão geral; altere para 0 se preferir 24H.
  const [selectedFilter, setSelectedFilter] = useState(timeFilters.length - 1);

  // Acrescenta pnl em cada ponto
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({ ...d, pnl: d.value - d.invested }));
  }, [data]);

  // Aplica filtro temporal
  const filteredData = useMemo(() => {
    if (processedData.length === 0) return [];

    const { days } = timeFilters[selectedFilter];
    if (days === 0) return processedData; // Total

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = processedData.filter((d) => new Date(d.date).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : processedData; // fallback caso não haja dados
  }, [processedData, selectedFilter]);

  // Calcula performance no período filtrado
  const performance = useMemo(() => {
    if (filteredData.length < 2) return { absolute: 0, percentage: 0 };
    const first = filteredData[0].pnl;
    const last = filteredData[filteredData.length - 1].pnl;
    const absolute = last - first;
    const percentage = first !== 0 ? (absolute / Math.abs(first)) * 100 : 0;
    return { absolute, percentage };
  }, [filteredData]);

  // Cor principal baseada no último PNL
  const mainColor = filteredData.length && filteredData[filteredData.length - 1].pnl >= 0 ? '#10b981' : '#ef4444';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate)
    const now = new Date()
    // Se filtro for 24H, mostrar horas
    const { days } = timeFilters[selectedFilter]
    if (days === 1) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    // Se mesmo ano, omitir ano
    const opts: Intl.DateTimeFormatOptions = d.getFullYear() === now.getFullYear()
      ? { day: '2-digit', month: 'short' }
      : { day: '2-digit', month: 'short', year: '2-digit' }
    return d.toLocaleDateString('pt-BR', opts)
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Lucro/Prejuízo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-zinc-400">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Lucro/Prejuízo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-zinc-400">Nenhum dado disponível</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Lucro/Prejuízo</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={performance.absolute >= 0 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {performance.percentage >= 0 ? '+' : ''}
              {performance.percentage.toFixed(2)}%
            </Badge>
            <span className="text-sm text-zinc-400">
              {formatCurrency(performance.absolute)}
            </span>
          </div>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {timeFilters.map((f, idx) => (
            <Button
              key={f.label}
              size="sm"
              variant={idx === selectedFilter ? 'default' : 'outline'}
              className="text-xs h-8 px-3"
              onClick={() => setSelectedFilter(idx)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mainColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={formatDate}
            />
             <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              labelFormatter={formatDate}
              formatter={(val: number) => [formatCurrency(val as number), 'Lucro/Prejuízo']}
            />

            <Area
              type="monotone"
              dataKey="pnl"
              stroke={mainColor}
              fill="url(#pnlGradient)"
              strokeWidth={2}
              name="PNL"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
