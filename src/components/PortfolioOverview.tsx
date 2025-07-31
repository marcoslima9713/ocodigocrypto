import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

interface Portfolio {
  id: string;
  name: string;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
}

interface PortfolioOverviewProps {
  portfolios: Portfolio[];
}

export function PortfolioOverview({ portfolios }: PortfolioOverviewProps) {
  const totalInvested = portfolios.reduce((sum, p) => sum + p.total_invested, 0);
  const totalCurrentValue = portfolios.reduce((sum, p) => sum + p.current_value, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const stats = [
    {
      title: 'Total Investido',
      value: `$${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-blue-500',
    },
    {
      title: 'Valor Atual',
      value: `$${totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: PieChart,
      color: 'text-purple-500',
    },
    {
      title: 'Lucro/Prejuízo',
      value: `$${Math.abs(totalProfitLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: totalProfitLoss >= 0 ? TrendingUp : TrendingDown,
      color: totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      title: 'Retorno (%)',
      value: `${totalProfitLossPercentage.toFixed(2)}%`,
      icon: totalProfitLoss >= 0 ? TrendingUp : TrendingDown,
      color: totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}