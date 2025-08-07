import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CryptoImage {
  id: string;
  symbol: string;
  name: string;
  image_url: string;
  created_at: string;
}

export const useCryptoImages = () => {
  const [cryptoImages, setCryptoImages] = useState<CryptoImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCryptoImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('crypto_images')
        .select('*')
        .order('symbol');

      if (error) throw error;

      setCryptoImages(data || []);
    } catch (err) {
      console.error('Error fetching crypto images:', err);
      setError('Falha ao carregar imagens das criptomoedas');
    } finally {
      setLoading(false);
    }
  };

  const getCryptoImage = (symbol: string): string | null => {
    const crypto = cryptoImages.find(img => img.symbol.toUpperCase() === symbol.toUpperCase());
    return crypto?.image_url || null;
  };

  useEffect(() => {
    fetchCryptoImages();
  }, []);

  return {
    cryptoImages,
    loading,
    error,
    getCryptoImage,
    refetch: fetchCryptoImages
  };
}; 