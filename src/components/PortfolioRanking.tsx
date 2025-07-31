import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface RankingEntry {
  user_id: string;
  user_email: string;
  total_profit_loss_percentage: number;
  total_current_value: number;
  total_invested: number;
  portfolios_count: number;
}

export function PortfolioRanking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      // Por enquanto, usar dados mockados
      const mockRanking = [
        {
          user_id: '1',
          user_email: 'user_top1@example.com',
          total_profit_loss_percentage: 25.5,
          total_current_value: 12550,
          total_invested: 10000,
          portfolios_count: 2,
        },
        {
          user_id: '2',
          user_email: 'user_crypto@example.com',
          total_profit_loss_percentage: 18.3,
          total_current_value: 5915,
          total_invested: 5000,
          portfolios_count: 1,
        },
        {
          user_id: '3',
          user_email: 'user_trader@example.com',
          total_profit_loss_percentage: 12.7,
          total_current_value: 2254,
          total_invested: 2000,
          portfolios_count: 3,
        },
      ];

      setRanking(mockRanking);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ranking de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ranking de Performance Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado de ranking disponível ainda
            </div>
          ) : (
            <div className="space-y-4">
              {ranking.map((entry, index) => (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(index + 1)}
                    <div>
                      <p className="font-medium">{entry.user_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.portfolios_count} portfólio{entry.portfolios_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">
                        ${entry.total_current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Investido: ${entry.total_invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <Badge 
                      variant={entry.total_profit_loss_percentage >= 0 ? "default" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      {entry.total_profit_loss_percentage >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {entry.total_profit_loss_percentage.toFixed(2)}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}