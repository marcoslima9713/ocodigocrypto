import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Coins, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { getRealTimePrices } from '@/services/cryptoPriceService';
import { useUserAuth } from '@/hooks/useAuth';
import { loadHistoricalData, getPriceAtDate, getCurrentPrice, getDataRange } from '@/services/historicalDataService';

interface DCACryptocurrency {
  id: string;
  symbol: string;
  name: string;
  coin_gecko_id: string;
  image_url?: string;
  is_active: boolean;
  order_index: number;
}

interface DCACalculation {
  total_invested: number;
  current_value: number;
  profitability_percentage: number;
  total_coins: number;
  chart_data: Array<{
    date: string;
    invested: number;
    value: number;
    coins: number;
  }>;
}

const frequencyOptions = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' }
];

export default function DCACalculator() {
  const navigate = useNavigate();
  const { currentUser } = useUserAuth();
  
  const [cryptocurrencies, setCryptocurrencies] = useState<DCACryptocurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [initialDate, setInitialDate] = useState<string>('2020-02-13');
  const [investmentAmount, setInvestmentAmount] = useState<number>(100);
  const [frequency, setFrequency] = useState<string>('weekly');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState<DCACalculation | null>(null);
  const [historicalDataLoaded, setHistoricalDataLoaded] = useState(false);

  useEffect(() => {
    fetchCryptocurrencies();
    loadHistoricalData().then(() => {
      setHistoricalDataLoaded(true);
      const currentPrice = getCurrentPrice();
      if (currentPrice) {
        setCurrentPrice(currentPrice);
      }
    }).catch(error => {
      console.error('Erro ao carregar dados históricos:', error);
    });
  }, []);

  useEffect(() => {
    if (selectedCrypto && currentPrice > 0 && historicalDataLoaded) {
      calculateDCA();
    }
  }, [selectedCrypto, initialDate, investmentAmount, frequency, currentPrice, historicalDataLoaded]);

  const fetchCryptocurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('dca_cryptocurrencies')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setCryptocurrencies(data || []);
    } catch (error) {
      console.error('Erro ao buscar criptomoedas:', error);
    }
  };

  const fetchCurrentPrice = async () => {
    try {
      const selectedCryptoData = cryptocurrencies.find(c => c.symbol === selectedCrypto);
      if (!selectedCryptoData) return;

      const prices = await getRealTimePrices([selectedCryptoData.coin_gecko_id], 'brl');
      const price = prices[selectedCryptoData.coin_gecko_id]?.brl || 0;
      setCurrentPrice(price);
    } catch (error) {
      console.error('Erro ao buscar preço atual:', error);
    }
  };

  useEffect(() => {
    if (cryptocurrencies.length > 0) {
      fetchCurrentPrice();
      setLoading(false);
    }
  }, [cryptocurrencies, selectedCrypto]);

  const calculateDCA = async () => {
    if (!currentPrice || !initialDate) return;

    setCalculating(true);
    
    try {
      const startDate = new Date(initialDate);
      const endDate = new Date();
      
      // Verificar se a data inicial é válida
      if (startDate > endDate) {
        console.error('Data inicial não pode ser no futuro');
        return;
      }

      let totalInvested = 0;
      let totalCoins = 0;
      const chartData: Array<{ date: string; invested: number; value: number; coins: number }> = [];

      // Simular compras baseado na frequência
      const frequencyDays = {
        daily: 1,
        weekly: 7,
        biweekly: 14,
        monthly: 30,
        yearly: 365
      };

      const daysBetweenPurchases = frequencyDays[frequency as keyof typeof frequencyDays] || 7;
      const numberOfPurchases = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * daysBetweenPurchases));

      const selectedCryptoData = cryptocurrencies.find(c => c.symbol === selectedCrypto);
      if (!selectedCryptoData) return;

      // Usar dados históricos reais
      for (let i = 0; i <= numberOfPurchases; i++) {
        const purchaseDate = new Date(startDate);
        purchaseDate.setDate(startDate.getDate() + (i * daysBetweenPurchases));
        
        if (purchaseDate > endDate) break;

        const dateString = purchaseDate.toISOString().split('T')[0];
        const historicalPrice = getPriceAtDate(dateString);
        
        if (!historicalPrice) {
          console.warn(`Preço não encontrado para ${dateString}, pulando...`);
          continue;
        }
        
        const coinsPurchased = investmentAmount / historicalPrice;
        totalCoins += coinsPurchased;
        totalInvested += investmentAmount;

        chartData.push({
          date: dateString,
          invested: totalInvested,
          value: totalCoins * historicalPrice,
          coins: totalCoins
        });
      }

      const currentValue = totalCoins * currentPrice;
      const profitabilityPercentage = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

      setCalculation({
        total_invested: totalInvested,
        current_value: currentValue,
        profitability_percentage: profitabilityPercentage,
        total_coins: totalCoins,
        chart_data: chartData
      });
    } catch (error) {
      console.error('Erro ao calcular DCA:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatCryptoAmount = (value: number) => {
    return value.toFixed(8);
  };

  const selectedCryptoData = cryptocurrencies.find(c => c.symbol === selectedCrypto);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50"
      >
        <div className="px-4 sm:px-8 lg:px-16 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-3">
                <Calculator className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl sm:text-2xl font-bold">Calculadora DCA</h1>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="px-4 sm:px-8 lg:px-16 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cryptocurrency Selection */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>Criptomoeda</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {cryptocurrencies.map((crypto) => (
                      <SelectItem key={crypto.id} value={crypto.symbol} className="text-white">
                        <div className="flex items-center space-x-2">
                          {crypto.image_url && (
                            <img src={crypto.image_url} alt={crypto.name} className="w-4 h-4 rounded-full" />
                          )}
                          <span>{crypto.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Data de Início</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="date"
                  value={initialDate}
                  onChange={(e) => setInitialDate(e.target.value)}
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </CardContent>
            </Card>

            {/* Investment Amount */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Valor do Investimento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <input
                   type="number"
                   value={investmentAmount}
                   onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                   min="1"
                   step="0.01"
                   className="w-full bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                   placeholder="$ 100.00"
                 />
              </CardContent>
            </Card>

            {/* Frequency Selection */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Frequência de Compra</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {frequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Current Price Display */}
            {currentPrice > 0 && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Preço Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {formatCurrency(currentPrice)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedCryptoData?.name}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Results and Chart */}
          <div className="lg:col-span-2 space-y-6">
                         {/* Key Metrics */}
             {calculating && (
               <Card className="bg-gray-900/50 border-gray-800">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-center space-x-2">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                     <span className="text-white">Calculando DCA...</span>
                   </div>
                 </CardContent>
               </Card>
             )}
             
             {calculation && !calculating && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-2">Investido</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(calculation.total_invested)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-2">Valor Atual</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(calculation.current_value)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatCryptoAmount(calculation.total_coins)} {selectedCrypto}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-2">Rentabilidade</div>
                    <div className={`text-2xl font-bold ${
                      calculation.profitability_percentage >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatPercentage(calculation.profitability_percentage)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

                         {/* Chart */}
             {calculation && !calculating && calculation.chart_data.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Evolução do Investimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={calculation.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fontSize: 12 }}
                        />
                                                 <YAxis 
                           stroke="#9CA3AF"
                           tick={{ fontSize: 12 }}
                           tickFormatter={(value) => `$ ${(value / 1000).toFixed(0)}k`}
                         />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#F9FAFB' }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === 'invested' ? 'Investido' : name === 'value' ? 'Valor Atual' : 'Moedas'
                          ]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="invested" 
                          stackId="1"
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stackId="2"
                          stroke="#F59E0B" 
                          fill="#F59E0B" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Como usar esta calculadora?</CardTitle>
                </CardHeader>
                <CardContent>
                                     <p className="text-gray-300 text-sm">
                     A calculadora de investimento em Bitcoin usa dados históricos reais para simular investimentos DCA. 
                     Explore diferentes parâmetros para avaliar o desempenho passado e identificar estratégias 
                     ótimas para futuros investimentos em Bitcoin.
                   </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Como calcular o valor do portfólio?</CardTitle>
                </CardHeader>
                <CardContent>
                                     <p className="text-gray-300 text-sm">
                     A partir de uma data inicial especificada, são simuladas compras recorrentes usando preços 
                     históricos reais do Bitcoin. Para cada compra simulada, o preço real da data é usado 
                     para determinar a quantidade de Bitcoin adquirida naquele momento específico.
                   </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">O que é o DCA em Bitcoin?</CardTitle>
                </CardHeader>
                <CardContent>
                                     <p className="text-gray-300 text-sm">
                     DCA (Dollar Cost Averaging) em Bitcoin é investir um valor fixo em dólares regularmente, 
                     como "$100 por semana". Esta estratégia é empregada por investidores de longo prazo para 
                     mitigar o risco de investir todo o capital em um pico de preço.
                   </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 