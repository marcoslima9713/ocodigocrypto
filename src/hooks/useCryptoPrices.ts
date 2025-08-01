import { useState, useEffect } from 'react';

interface CryptoPrice {
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface CryptoPrices {
  [symbol: string]: CryptoPrice;
}

// Mapeamento de símbolos para IDs da CoinGecko
const COINGECKO_IDS: { [symbol: string]: string } = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'cardano': 'cardano',
  'polkadot': 'polkadot',
  'solana': 'solana',
  'polygon': 'matic-network',
  'avalanche-2': 'avalanche-2',
  'cosmos': 'cosmos',
  'chainlink': 'chainlink',
  'uniswap': 'uniswap',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'LINK': 'chainlink',
  'UNI': 'uniswap'
};

export function useCryptoPrices(symbols: string[] = []) {
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setError(null);
      
            // Constrói lista de IDs
      const defaultIds = [
        'bitcoin', 'ethereum', 'cardano', 'polkadot', 'solana',
        'matic-network', 'avalanche-2', 'cosmos', 'chainlink', 'uniswap'
      ];

      // Se o componente receber símbolos adicionais, mapeia para IDs
      const extraIds = symbols
        .map((sym) => COINGECKO_IDS[sym] || COINGECKO_IDS[sym.toUpperCase()] || COINGECKO_IDS[sym.toLowerCase()])
        .filter(Boolean);

      const cryptoIds = Array.from(new Set([...defaultIds, ...extraIds]));

      // Buscar preços da CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_high_24h=true&include_low_24h=true`
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar preços da CoinGecko');
      }

      const data = await response.json();
      
      // Transformar dados da API para o formato esperado
      const formattedPrices: CryptoPrices = {};
      
      Object.entries(data).forEach(([id, priceData]: [string, any]) => {
        // Encontrar o símbolo correspondente
        const symbol = Object.keys(COINGECKO_IDS).find(key => COINGECKO_IDS[key] === id);
        
        if (symbol) {
          formattedPrices[symbol] = {
            current_price: priceData.usd || 0,
            price_change_percentage_24h: priceData.usd_24h_change || 0,
            market_cap: priceData.usd_market_cap || 0,
            total_volume: priceData.usd_24h_vol || 0,
            high_24h: priceData.usd_high_24h || 0,
            low_24h: priceData.usd_low_24h || 0,
            sparkline_in_7d: {
              price: Array.from({ length: 168 }, () => 
                (priceData.usd || 100) * (1 + (Math.random() - 0.5) * 0.1)
              )
            }
          };
        }
      });

      setPrices(formattedPrices);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar preços:', err);
      setError('Erro ao carregar preços das criptomoedas');
      setLoading(false);
      
      // Fallback para dados simulados em caso de erro
      const fallbackPrices: CryptoPrices = {};
      const cryptoIds = ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'solana'];
      
      cryptoIds.forEach((id, index) => {
        const basePrice = 1000 + (index * 500) + Math.random() * 1000;
        const change24h = (Math.random() - 0.5) * 20;
        
        fallbackPrices[id] = {
          current_price: basePrice,
          price_change_percentage_24h: change24h,
          market_cap: basePrice * (1000000 + Math.random() * 1000000),
          total_volume: basePrice * (100000 + Math.random() * 100000),
          high_24h: basePrice * (1 + Math.random() * 0.1),
          low_24h: basePrice * (1 - Math.random() * 0.1),
          sparkline_in_7d: {
            price: Array.from({ length: 168 }, () => 
              basePrice * (1 + (Math.random() - 0.5) * 0.2)
            )
          }
        };
      });
      
      setPrices(fallbackPrices);
    }
  };

  // Buscar preços iniciais
  useEffect(() => {
    fetchPrices();
  }, [symbols.join(',')]);

  // Atualizar preços a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices
  };
}