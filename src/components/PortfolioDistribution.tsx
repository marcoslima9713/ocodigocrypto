import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart } from 'lucide-react';

interface Holding {
  crypto_symbol: string;
  total_amount: number;
  average_buy_price: number;
  total_invested: number;
}

interface PortfolioDistributionProps {
  holdings: Holding[];
  currentPrices: { [symbol: string]: number };
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function PortfolioDistribution({ holdings, currentPrices }: PortfolioDistributionProps) {
  const distribution = useMemo(() => {
    if (!holdings.length) return [];

    const totalValue = holdings.reduce((sum, holding) => {
      const currentPrice = currentPrices[holding.crypto_symbol] || holding.average_buy_price;
      return sum + (holding.total_amount * currentPrice);
    }, 0);

    return holdings.map((holding, index) => {
      const currentPrice = currentPrices[holding.crypto_symbol] || holding.average_buy_price;
      const currentValue = holding.total_amount * currentPrice;
      const percentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

      return {
        symbol: holding.crypto_symbol,
        currentValue,
        percentage,
        color: COLORS[index % COLORS.length],
        amount: holding.total_amount,
        averagePrice: holding.average_buy_price
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [holdings, currentPrices]);

  if (holdings.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PieChart className="w-5 h-5" />
            Distribuição do Portfólio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-400">Adicione transações para ver a distribuição</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = distribution.reduce((sum, item) => sum + item.currentValue, 0);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <PieChart className="w-5 h-5" />
          Distribuição do Portfólio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico de pizza SVG */}
          <div className="flex justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#374151"
                strokeWidth="40"
              />
              {distribution.map((item, index) => {
                const previousPercentage = distribution
                  .slice(0, index)
                  .reduce((sum, d) => sum + d.percentage, 0);
                
                const startAngle = (previousPercentage / 100) * 360;
                const endAngle = ((previousPercentage + item.percentage) / 100) * 360;
                
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                
                const x1 = 100 + 80 * Math.cos(startRad);
                const y1 = 100 + 80 * Math.sin(startRad);
                const x2 = 100 + 80 * Math.cos(endRad);
                const y2 = 100 + 80 * Math.sin(endRad);
                
                const largeArcFlag = item.percentage > 50 ? 1 : 0;
                
                const pathData = [
                  `M ${x1} ${y1}`,
                  `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'L 100 100',
                  'Z'
                ].join(' ');

                return (
                  <path
                    key={item.symbol}
                    d={pathData}
                    fill={item.color}
                    stroke="#1F2937"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>

          {/* Lista de distribuição */}
          <div className="space-y-4">
            {distribution.map((item, index) => (
              <div key={item.symbol} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="font-medium text-white">{item.symbol}</div>
                      <div className="text-sm text-zinc-400">
                        {item.amount.toFixed(6)} @ ${item.averagePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">
                      ${item.currentValue.toFixed(2)}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Valor Total do Portfólio</span>
              <span className="text-xl font-bold text-white">
                ${totalValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 