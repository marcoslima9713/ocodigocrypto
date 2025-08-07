import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolios: Array<{ id: string; name: string }>;
  selectedPortfolioId?: string | null;
  onTransactionAdded: () => void;
}

const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', shortName: 'BTC', coinGeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', shortName: 'ETH', coinGeckoId: 'ethereum' },
  { symbol: 'ADA', name: 'Cardano', shortName: 'ADA', coinGeckoId: 'cardano' },
  { symbol: 'DOT', name: 'Polkadot', shortName: 'DOT', coinGeckoId: 'polkadot' },
  { symbol: 'SOL', name: 'Solana', shortName: 'SOL', coinGeckoId: 'solana' },
  { symbol: 'MATIC', name: 'Polygon', shortName: 'MATIC', coinGeckoId: 'matic-network' },
  { symbol: 'AVAX', name: 'Avalanche', shortName: 'AVAX', coinGeckoId: 'avalanche-2' },
  { symbol: 'ATOM', name: 'Cosmos', shortName: 'ATOM', coinGeckoId: 'cosmos' },
  { symbol: 'LINK', name: 'Chainlink', shortName: 'LINK', coinGeckoId: 'chainlink' },
  { symbol: 'UNI', name: 'Uniswap', shortName: 'UNI', coinGeckoId: 'uniswap' },
];

export function AddTransactionDialog({
  open,
  onOpenChange,
  portfolios,
  selectedPortfolioId,
  onTransactionAdded,
}: AddTransactionDialogProps) {
  const { currentUser } = useAuth();
  const cryptoIds = CRYPTO_ASSETS.map(crypto => crypto.coinGeckoId);
  const { prices } = useCryptoPrices(cryptoIds);
  const { addTransaction } = usePortfolio(selectedPortfolioId || 'main');
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    portfolio_id: selectedPortfolioId || 'main',
    crypto_symbol: '',
    transaction_type: 'buy' as 'buy' | 'sell',
    amount: '',
    price_per_unit: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        portfolio_id: selectedPortfolioId || 'main',
        crypto_symbol: '',
        transaction_type: 'buy',
        amount: '',
        price_per_unit: '',
      });
      setDate(new Date());
      setErrors({});
    }
  }, [open, selectedPortfolioId]);

  // Auto-fill price when crypto is selected
  const handleCryptoChange = (symbol: string) => {
    const selectedCrypto = CRYPTO_ASSETS.find(crypto => crypto.symbol === symbol);
    const coinGeckoId = selectedCrypto?.coinGeckoId || symbol.toLowerCase();
    setFormData(prev => ({ 
      ...prev, 
      crypto_symbol: symbol,
      price_per_unit: prices[coinGeckoId]?.usd?.toString() || ''
    }));
    setErrors(prev => ({ ...prev, crypto_symbol: '' }));
  };

  // Calculate total when amount or price changes
  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const price = parseFloat(formData.price_per_unit) || 0;
    const total = amount * price;
    return total;
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.crypto_symbol) {
      newErrors.crypto_symbol = 'Selecione uma criptomoeda';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Quantidade deve ser maior que zero';
    }

    if (!formData.price_per_unit || parseFloat(formData.price_per_unit) <= 0) {
      newErrors.price_per_unit = 'Preço deve ser maior que zero';
    }

    if (!date) {
      newErrors.date = 'Selecione uma data';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos destacados.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const success = await addTransaction(
        formData.crypto_symbol,
        formData.transaction_type,
        parseFloat(formData.amount),
        parseFloat(formData.price_per_unit)
      );

      if (success) {
        toast({
          title: "Transação adicionada com sucesso!",
          description: "Seu portfólio foi atualizado.",
        });
        onTransactionAdded();
        onOpenChange(false);
      } else {
        toast({
          title: "Erro ao adicionar transação",
          description: "Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast({
        title: "Erro ao adicionar transação",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCrypto = CRYPTO_ASSETS.find(crypto => crypto.symbol === formData.crypto_symbol);
  const coinGeckoId = selectedCrypto?.coinGeckoId || formData.crypto_symbol.toLowerCase();
  const currentPrice = prices[coinGeckoId]?.usd;
  const totalValue = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Adicionar Transação
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova compra ou venda de criptomoeda ao seu portfólio
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Portfolio Selection */}
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfólio</Label>
            <Select
              value={formData.portfolio_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, portfolio_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um portfólio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Tipo de Transação</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={formData.transaction_type === 'buy' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'buy' }))}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Compra
              </Button>
              <Button
                type="button"
                variant={formData.transaction_type === 'sell' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'sell' }))}
                className="flex items-center gap-2"
              >
                <TrendingDown className="w-4 h-4" />
                Venda
              </Button>
            </div>
          </div>

          {/* Cryptocurrency Selection */}
          <div className="space-y-2">
            <Label htmlFor="crypto">Criptomoeda</Label>
            <Select
              value={formData.crypto_symbol}
              onValueChange={handleCryptoChange}
            >
              <SelectTrigger className={cn(errors.crypto_symbol && "border-red-500")}>
                <SelectValue placeholder="Selecione uma criptomoeda" />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_ASSETS.map((crypto) => {
                  const price = prices[crypto.coinGeckoId]?.usd;
                  return (
                    <SelectItem key={crypto.symbol} value={crypto.symbol}>
                      <div className="flex items-center justify-between w-full">
                        <span>{crypto.shortName} - {crypto.name}</span>
                        {price && (
                          <span className="text-muted-foreground ml-2">
                            ${price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.crypto_symbol && (
              <p className="text-sm text-red-500">{errors.crypto_symbol}</p>
            )}
          </div>

          {/* Amount and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Quantidade</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder="0.000000"
                value={formData.amount}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, amount: e.target.value }));
                  setErrors(prev => ({ ...prev, amount: '' }));
                }}
                className={cn(errors.amount && "border-red-500")}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço por Unidade ($)</Label>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.price_per_unit}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, price_per_unit: e.target.value }));
                  setErrors(prev => ({ ...prev, price_per_unit: '' }));
                }}
                className={cn(errors.price_per_unit && "border-red-500")}
              />
              {errors.price_per_unit && (
                <p className="text-sm text-red-500">{errors.price_per_unit}</p>
              )}
            </div>
          </div>

          {/* Current Price Info */}
          {selectedCrypto && currentPrice && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>Preço atual do {selectedCrypto.shortName}:</span>
                <span className="font-semibold">${currentPrice.toLocaleString()}</span>
              </div>
              {parseFloat(formData.price_per_unit) > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span>Diferença:</span>
                  <span className={cn(
                    "font-semibold",
                    parseFloat(formData.price_per_unit) > currentPrice ? "text-red-600" : "text-green-600"
                  )}>
                    {((parseFloat(formData.price_per_unit) - currentPrice) / currentPrice * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Total Value */}
          {totalValue > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Valor Total:</span>
                <span className="text-lg font-bold">${totalValue.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Data da Transação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate || new Date());
                    setErrors(prev => ({ ...prev, date: '' }));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Adicionar Transação
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}