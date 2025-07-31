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
  portfolioId: string;
  portfolioName: string;
  totalInvested: number;
  currentValue: number;
}

const timeFrames = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
  { label: '3Y', value: '3y' },
  { label: '5Y', value: '5y' },
  { label: 'All', value: 'all' },
];

export function PortfolioChart({ portfolioId, portfolioName, totalInvested, currentValue }: PortfolioChartProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('all');

  // Dados mockados para demonstração - em produção, estes viriam da API
  const generateMockData = (): ChartData[] => {
    const data: ChartData[] = [];
    const startDate = new Date('2023-01-01');
    const endDate = new Date();
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i += 7) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const progress = i / daysDiff;
      
      // Simular crescimento com alguma volatilidade
      const baseGrowth = totalInvested + (currentValue - totalInvested) * progress;
      const volatility = Math.sin(i / 10) * (currentValue * 0.1);
      const value = Math.max(baseGrowth + volatility, totalInvested * 0.8);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
        invested: totalInvested,
      });
    }
    
    return data;
  };

  const chartData = generateMockData();
  const maxValue = Math.max(...chartData.map(d => d.value));
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
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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