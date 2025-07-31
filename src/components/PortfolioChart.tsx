import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

interface ChartData {
  date: string;
  value: number;
  invested: number;
}

interface PortfolioChartProps {
  chartData: ChartData[];
  totalInvested: number;
  currentValue: number;
}

const timeFrames = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

export function PortfolioChart({ chartData, totalInvested, currentValue }: PortfolioChartProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('all');

  // Filter chart data based on selected time frame
  const getFilteredData = (): ChartData[] => {
    if (!chartData.length) return [];
    
    const now = new Date();
    let filterDate = new Date();
    
    switch (selectedTimeFrame) {
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case '1y':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return chartData;
    }
    
    return chartData.filter(item => new Date(item.date) >= filterDate);
  };

  const filteredData = getFilteredData();
  const maxValue = Math.max(...(filteredData.length ? filteredData.map(d => d.value) : [0]));
  const formatCurrency = (value: number) => `$${(value / 1000).toFixed(1)}K`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Portfolio Charts</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4">
            {timeFrames.map((timeFrame) => (
              <Button
                key={timeFrame.value}
                variant={selectedTimeFrame === timeFrame.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeFrame(timeFrame.value)}
                className="text-xs"
              >
                {timeFrame.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' });
                  }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                  domain={[0, maxValue * 1.1]}
                />
                
                {/* Linha de referência do valor investido */}
                <Line
                  type="monotone"
                  dataKey="invested"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                />
                
                {/* Área principal do portfólio */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  dot={false}
                  activeDot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <span>Invested ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}