import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addPriceUpdateListener } from '@/services/cryptoPriceService';
import { RefreshCw, CheckCircle } from 'lucide-react';

interface PriceUpdateNotificationProps {
  enabled?: boolean;
}

export const PriceUpdateNotification: React.FC<PriceUpdateNotificationProps> = ({ 
  enabled = true 
}) => {
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = addPriceUpdateListener((prices, coins) => {
      const now = new Date();
      setLastUpdate(now);

      // Mostrar toast apenas se não for a primeira atualização
      if (lastUpdate) {
        toast({
          title: "Preços Atualizados!",
          description: `${coins.length} moedas foram atualizadas automaticamente.`,
          action: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Atualizado às {now.toLocaleTimeString('pt-BR')}</span>
            </div>
          ),
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, lastUpdate, toast]);

  return null; // Componente invisível, apenas para efeitos colaterais
};

export default PriceUpdateNotification; 