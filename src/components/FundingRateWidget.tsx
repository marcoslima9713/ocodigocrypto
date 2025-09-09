import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Zap, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fundingRateService, FundingRateData, ArbitrageOpportunity } from '@/services/fundingRateService';

export const FundingRateWidget = () => {
  const navigate = useNavigate();
  const [fundingRates, setFundingRates] = useState<FundingRateData[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rates, opps] = await Promise.all([
        fundingRateService.getAllFundingRates(),
        fundingRateService.getArbitrageOpportunities()
      ]);
      
      setFundingRates(rates);
      setOpportunities(opps);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados de funding rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Atualizar a cada 10 minutos
    const interval = setInterval(loadData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatFundingRate = (rate: number) => {
    return `${(rate * 100).toFixed(4)}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'Baixo';
      case 'MEDIUM': return 'Médio';
      case 'HIGH': return 'Alto';
      default: return 'Desconhecido';
    }
  };

  const topOpportunity = opportunities[0];
  const btcRates = fundingRates.filter(rate => rate.symbol === 'BTCUSDT');
  const ethRates = fundingRates.filter(rate => rate.symbol === 'ETHUSDT');

  const averageBTCRate = btcRates.length > 0 
    ? btcRates.reduce((acc, rate) => acc + rate.fundingRate, 0) / btcRates.length 
    : 0;

  const averageETHRate = ethRates.length > 0 
    ? ethRates.reduce((acc, rate) => acc + rate.fundingRate, 0) / ethRates.length 
    : 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-green-500 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
                         <CardTitle className="text-white text-lg">Pools de Liquidez</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
                         onClick={() => navigate('/modulo/maquina-alavancagem-2')}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
          >
            Máquina de Alavancagem
          </Button>
        </div>
                 <CardDescription className="text-gray-300 text-sm">
           Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')} • Binance
         </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Melhor Oportunidade */}
        {topOpportunity && (
          <div className="bg-white/5 rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white text-sm">Melhor Oportunidade</span>
              <Badge className={getRiskColor(topOpportunity.risk)}>
                {getRiskText(topOpportunity.risk)}
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">{topOpportunity.symbol}</span>
                <span className="text-purple-400 font-mono">
                  {formatFundingRate(topOpportunity.fundingRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">{topOpportunity.exchange}</span>
                <span className="text-green-400 font-mono">
                  {formatFundingRate(topOpportunity.dailyReturn)}/dia
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Médias por Ativo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-300 mb-1">BTC Média</div>
            <div className={`text-lg font-bold ${averageBTCRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatFundingRate(averageBTCRate)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-300 mb-1">ETH Média</div>
            <div className={`text-lg font-bold ${averageETHRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatFundingRate(averageETHRate)}
            </div>
          </div>
        </div>

        {/* Status do Mercado */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-gray-300">Bull Market</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-gray-300">8h</span>
          </div>
        </div>

        {/* Alertas */}
        {Math.abs(averageBTCRate) > 0.01 || Math.abs(averageETHRate) > 0.01 ? (
          <div className="flex items-center space-x-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400">Funding rates altos detectados</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400">Mercado estável</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
