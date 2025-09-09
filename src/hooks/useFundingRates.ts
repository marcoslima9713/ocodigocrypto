import { useState, useEffect, useCallback } from 'react';
import { fundingRateService, FundingRateData, ArbitrageOpportunity, PositionSimulation } from '@/services/fundingRateService';

export const useFundingRates = () => {
  const [fundingRates, setFundingRates] = useState<FundingRateData[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [rates, opps] = await Promise.all([
        fundingRateService.getAllFundingRates(),
        fundingRateService.getArbitrageOpportunities()
      ]);
      
      setFundingRates(rates);
      setOpportunities(opps);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao carregar dados de funding rate:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateSimulation = useCallback((
    capital: number,
    symbol: string,
    exchange: string,
    leverage: number = 1
  ): PositionSimulation | null => {
    const selectedRate = fundingRates.find(rate => 
      rate.symbol === symbol && rate.exchange === exchange
    );
    
    if (!selectedRate) return null;
    
    return fundingRateService.calculatePositionSimulation(
      capital,
      selectedRate.fundingRate,
      leverage
    );
  }, [fundingRates]);

  const getTopOpportunities = useCallback((limit: number = 5) => {
    return opportunities
      .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate))
      .slice(0, limit);
  }, [opportunities]);

  const getFundingRatesBySymbol = useCallback((symbol: string) => {
    return fundingRates.filter(rate => rate.symbol === symbol);
  }, [fundingRates]);

  const getFundingRatesByExchange = useCallback((exchange: string) => {
    return fundingRates.filter(rate => rate.exchange === exchange);
  }, [fundingRates]);

  const getAverageFundingRate = useCallback((symbol: string) => {
    const rates = getFundingRatesBySymbol(symbol);
    if (rates.length === 0) return 0;
    
    const sum = rates.reduce((acc, rate) => acc + rate.fundingRate, 0);
    return sum / rates.length;
  }, [getFundingRatesBySymbol]);

  useEffect(() => {
    loadData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  return {
    fundingRates,
    opportunities,
    isLoading,
    error,
    lastUpdate,
    loadData,
    calculateSimulation,
    getTopOpportunities,
    getFundingRatesBySymbol,
    getFundingRatesByExchange,
    getAverageFundingRate
  };
};
