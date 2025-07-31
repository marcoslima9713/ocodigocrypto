import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Wallet, BarChart3, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import { PortfolioChart } from '@/components/PortfolioChart';
import { usePortfolio } from '@/hooks/usePortfolio';

export default function CryptoPortfolio() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { 
    totalInvested, 
    currentValue, 
    profitLoss, 
    profitLossPercentage, 
    holdings, 
    loading, 
    error,
    chartData,
    addTransaction,
    refetch
  } = usePortfolio('main');
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const handleTransactionAdded = async () => {
    await refetch();
    setShowAddTransaction(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Por favor, faça login para acessar seu portfólio</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando portfólio...</p>
        </div>
      </div>
    );
  }

  const hasInvestments = totalInvested > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Meu Portfólio Crypto
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus investimentos em criptomoedas e acompanhe sua performance
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <p className="text-destructive">{error}</p>
          </motion.div>
        )}

        {!hasInvestments ? (
          // Empty State - No Investments
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Seu portfólio está vazio
            </h2>
            <p className="text-muted-foreground mb-6">
              Comece adicionando sua primeira transação de criptomoeda
            </p>
            <Button onClick={() => setShowAddTransaction(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Transação
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro/Prejuízo</CardTitle>
                  {profitLoss >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Retorno %</CardTitle>
                  <Badge variant={profitLoss >= 0 ? "default" : "destructive"}>
                    {profitLoss >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {profitLoss >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Portfolio Chart */}
            <PortfolioChart
              chartData={chartData}
              totalInvested={totalInvested}
              currentValue={currentValue}
            />

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <Button onClick={() => setShowAddTransaction(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Transação
              </Button>
            </motion.div>

            {/* Holdings */}
            {holdings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold mb-4">Suas Criptomoedas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {holdings.map((holding) => (
                    <Card key={holding.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="uppercase">{holding.crypto_symbol}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Quantidade:</span>
                            <span className="font-medium">
                              {Number(holding.total_amount).toFixed(8)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Preço Médio:</span>
                            <span className="font-medium">
                              ${Number(holding.average_buy_price).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Investido:</span>
                            <span className="font-medium">
                              ${Number(holding.total_invested).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
          portfolios={[{ id: 'main', name: 'Portfólio Principal' }]}
          selectedPortfolioId="main"
          onTransactionAdded={handleTransactionAdded}
        />
      </div>
    </div>
  );
}