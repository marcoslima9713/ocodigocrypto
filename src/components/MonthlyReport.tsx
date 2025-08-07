import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getCoinGeckoId } from '@/services/cryptoPriceService';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  crypto_symbol: string;
  transaction_type: string;
  amount: number;
  price_usd: number;
  total_usd: number;
  transaction_date: string;
}

interface Holding {
  crypto_symbol: string;
  total_amount: number;
  average_buy_price: number;
  total_invested: number;
}

interface MonthlyReportProps {
  transactions: Transaction[];
  holdings: Holding[];
  currentPrices: { [id: string]: { usd: number; brl?: number } };
  selectedMonth?: Date;
}

export function MonthlyReport({ 
  transactions, 
  holdings, 
  currentPrices, 
  selectedMonth = new Date() 
}: MonthlyReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const reportData = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    // Filtrar transações do mês
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    // Calcular métricas do mês
    const totalInvested = monthTransactions
      .filter(t => t.transaction_type === 'buy')
      .reduce((sum, t) => sum + t.total_usd, 0);

    const totalSold = monthTransactions
      .filter(t => t.transaction_type === 'sell')
      .reduce((sum, t) => sum + t.total_usd, 0);

    const netInvestment = totalInvested - totalSold;

    // Calcular valor atual dos holdings
    const currentValue = holdings.reduce((sum, holding) => {
      const currentPrice = currentPrices[getCoinGeckoId(holding.crypto_symbol)]?.usd || holding.average_buy_price;
      return sum + (holding.total_amount * currentPrice);
    }, 0);

    const totalInvestedAllTime = holdings.reduce((sum, h) => sum + h.total_invested, 0);
    const unrealizedPnL = currentValue - totalInvestedAllTime;
    const unrealizedPnLPercentage = totalInvestedAllTime > 0 ? (unrealizedPnL / totalInvestedAllTime) * 100 : 0;

    // Top performers do mês
    const cryptoPerformance = holdings.map(holding => {
      const currentPrice = currentPrices[getCoinGeckoId(holding.crypto_symbol)]?.usd || holding.average_buy_price;
      const pnl = (currentPrice - holding.average_buy_price) * holding.total_amount;
      const pnlPercentage = ((currentPrice / holding.average_buy_price) - 1) * 100;
      
      return {
        symbol: holding.crypto_symbol,
        pnl,
        pnlPercentage,
        currentValue: holding.total_amount * currentPrice
      };
    }).sort((a, b) => b.pnlPercentage - a.pnlPercentage);

    return {
      monthStart,
      monthEnd,
      monthTransactions,
      totalInvested,
      totalSold,
      netInvestment,
      currentValue,
      totalInvestedAllTime,
      unrealizedPnL,
      unrealizedPnLPercentage,
      cryptoPerformance,
      topPerformers: cryptoPerformance.filter(p => p.pnlPercentage > 0).slice(0, 3),
      worstPerformers: cryptoPerformance.filter(p => p.pnlPercentage < 0).sort((a, b) => a.pnlPercentage - b.pnlPercentage).slice(0, 3)
    };
  }, [transactions, holdings, currentPrices, selectedMonth]);

  const generateCSV = () => {
    setIsGenerating(true);
    
    try {
      const csvContent = [
        // Header
        ['Relatório Mensal - ' + format(selectedMonth, 'MMMM yyyy', { locale: ptBR })],
        [],
        // Resumo
        ['Resumo do Mês'],
        ['Total Investido', `$${reportData.totalInvested.toFixed(2)}`],
        ['Total Vendido', `$${reportData.totalSold.toFixed(2)}`],
        ['Investimento Líquido', `$${reportData.netInvestment.toFixed(2)}`],
        ['Valor Atual do Portfólio', `$${reportData.currentValue.toFixed(2)}`],
        ['P&L Não Realizado', `$${reportData.unrealizedPnL.toFixed(2)}`],
        ['P&L %', `${reportData.unrealizedPnLPercentage.toFixed(2)}%`],
        [],
        // Transações
        ['Transações do Mês'],
        ['Data', 'Cripto', 'Tipo', 'Quantidade', 'Preço', 'Total'],
        ...reportData.monthTransactions.map(t => [
          format(new Date(t.transaction_date), 'dd/MM/yyyy'),
          t.crypto_symbol,
          t.transaction_type === 'buy' ? 'Compra' : 'Venda',
          t.amount.toFixed(6),
          `$${t.price_usd.toFixed(2)}`,
          `$${t.total_usd.toFixed(2)}`
        ]),
        [],
        // Performance por cripto
        ['Performance por Criptomoeda'],
        ['Cripto', 'P&L', 'P&L %', 'Valor Atual'],
        ...reportData.cryptoPerformance.map(p => [
          p.symbol,
          `$${p.pnl.toFixed(2)}`,
          `${p.pnlPercentage.toFixed(2)}%`,
          `$${p.currentValue.toFixed(2)}`
        ])
      ].map(row => row.join(',')).join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-${format(selectedMonth, 'yyyy-MM')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Relatório de {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Análise detalhada do seu portfólio no mês
              </p>
            </div>
            <Button onClick={generateCSV} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investimento do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData.totalInvested.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total investido em {format(selectedMonth, 'MMMM', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData.totalSold.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total vendido no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investimento Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.netInvestment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${reportData.netInvestment.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Investimento - Vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              P&L Não Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${reportData.unrealizedPnL.toFixed(2)}
            </div>
            <div className={`text-sm ${reportData.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {reportData.unrealizedPnLPercentage >= 0 ? '+' : ''}{reportData.unrealizedPnLPercentage.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Criptomoeda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Melhores Performances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topPerformers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum ativo encontrado</p>
            ) : (
              <div className="space-y-3">
                {reportData.topPerformers.map((performer, index) => (
                  <div key={performer.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{performer.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          ${performer.currentValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-semibold">
                        +{performer.pnlPercentage.toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${performer.pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Piores Performances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.worstPerformers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum ativo encontrado</p>
            ) : (
              <div className="space-y-3">
                {reportData.worstPerformers.map((performer, index) => (
                  <div key={performer.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{performer.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          ${performer.currentValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-semibold">
                        {performer.pnlPercentage.toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${performer.pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transações do Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Transações de {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.monthTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transação encontrada neste mês</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportData.monthTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant={transaction.transaction_type === 'buy' ? 'default' : 'secondary'}>
                      {transaction.transaction_type === 'buy' ? 'Compra' : 'Venda'}
                    </Badge>
                    <div>
                      <div className="font-medium">{transaction.crypto_symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(transaction.transaction_date), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {transaction.amount.toFixed(6)} {transaction.crypto_symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${transaction.price_usd.toFixed(2)} cada
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${transaction.total_usd.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 