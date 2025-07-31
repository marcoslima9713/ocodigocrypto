import { useState, useEffect } from 'react';

interface CryptoPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
}

interface CryptoPrices {
  [key: string]: CryptoPrice;
}

export function useCryptoPrices(symbols: string[] = ['bitcoin', 'ethereum', 'cardano', 'polkadot']) {
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setError(null);
      const symbolsParam = symbols.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbolsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`
      );
      
      if (!response.ok) {
        throw new Error('Falha ao buscar preços das criptomoedas');
      }
      
      const data = await response.json();
      
      // Transformar os dados para o formato esperado
      const formattedPrices: CryptoPrices = {};
      Object.entries(data).forEach(([id, priceData]: [string, any]) => {
        formattedPrices[id] = {
          id,
          symbol: id,
          current_price: priceData.usd,
          price_change_percentage_24h: priceData.usd_24h_change || 0,
          market_cap: priceData.usd_market_cap || 0,
          total_volume: priceData.usd_24h_vol || 0,
          last_updated: new Date(priceData.last_updated_at * 1000).toISOString(),
        };
      });
      
      setPrices(formattedPrices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar preços:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Atualizar preços a cada 30 segundos
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  return { prices, loading, error, refetch: fetchPrices };
}