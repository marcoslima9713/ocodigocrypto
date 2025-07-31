import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { PortfolioRanking } from '@/components/PortfolioRanking';
import { PortfolioOverview } from '@/components/PortfolioOverview';

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  total_invested: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  created_at: string;
}

export default function CryptoPortfolio() {
  const { currentUser } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchPortfolios();
    }
  }, [currentUser]);

  const fetchPortfolios = async () => {
    try {
      // Por enquanto, usar dados mockados
      const mockPortfolios = [
        {
          id: '1',
          name: 'Portfólio Principal',
          description: 'Meu portfólio principal de criptomoedas',
          total_invested: 5000,
          current_value: 6250,
          profit_loss: 1250,
          profit_loss_percentage: 25,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Portfólio DeFi',
          description: 'Investimentos em tokens DeFi',
          total_invested: 2000,
          current_value: 1800,
          profit_loss: -200,
          profit_loss_percentage: -10,
          created_at: new Date().toISOString(),
        },
      ];

      setPortfolios(mockPortfolios);
    } catch (error) {
      console.error('Erro ao buscar portfólios:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async () => {
    try {
      // Por enquanto, simular criação
      const newPortfolio = {
        id: Date.now().toString(),
        name: `Portfólio ${portfolios.length + 1}`,
        description: 'Meu novo portfólio de criptomoedas',
        total_invested: 0,
        current_value: 0,
        profit_loss: 0,
        profit_loss_percentage: 0,
        created_at: new Date().toISOString(),
      };

      setPortfolios([newPortfolio, ...portfolios]);
    } catch (error) {
      console.error('Erro ao criar portfólio:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando portfólios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Meu Portfólio Crypto
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus investimentos em criptomoedas e acompanhe sua performance
          </p>
        </motion.div>

        {portfolios.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Nenhum portfólio encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              Comece criando seu primeiro portfólio de criptomoedas
            </p>
            <Button onClick={createPortfolio} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Portfólio
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <PortfolioOverview portfolios={portfolios} />

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <Button onClick={createPortfolio}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Portfólio
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddTransaction(true)}
                disabled={portfolios.length === 0}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Adicionar Transação
              </Button>
            </motion.div>

            {/* Portfolio Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {portfolios.map((portfolio, index) => (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {portfolio.name}
                        <Badge variant={portfolio.profit_loss >= 0 ? "default" : "destructive"}>
                          {portfolio.profit_loss >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {portfolio.profit_loss_percentage.toFixed(2)}%
                        </Badge>
                      </CardTitle>
                      <CardDescription>{portfolio.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Investido:</span>
                          <span className="font-medium">
                            ${portfolio.total_invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Valor Atual:</span>
                          <span className="font-medium">
                            ${portfolio.current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">P&L:</span>
                          <span
                            className={`font-medium ${
                              portfolio.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            ${Math.abs(portfolio.profit_loss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => {
                          setSelectedPortfolio(portfolio.id);
                          setShowAddTransaction(true);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Portfolio Ranking */}
            <PortfolioRanking />
          </div>
        )}

        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolio}
          onTransactionAdded={fetchPortfolios}
        />
      </div>
    </div>
  );
}