import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Portfolio {
  id: string;
  name: string;
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolios: Portfolio[];
  selectedPortfolioId?: string | null;
  onTransactionAdded: () => void;
}

const CRYPTO_ASSETS = [
  { symbol: 'bitcoin', name: 'Bitcoin', shortName: 'BTC' },
  { symbol: 'ethereum', name: 'Ethereum', shortName: 'ETH' },
  { symbol: 'cardano', name: 'Cardano', shortName: 'ADA' },
  { symbol: 'polkadot', name: 'Polkadot', shortName: 'DOT' },
  { symbol: 'solana', name: 'Solana', shortName: 'SOL' },
  { symbol: 'polygon', name: 'Polygon', shortName: 'MATIC' },
  { symbol: 'avalanche-2', name: 'Avalanche', shortName: 'AVAX' },
  { symbol: 'cosmos', name: 'Cosmos', shortName: 'ATOM' },
  { symbol: 'chainlink', name: 'Chainlink', shortName: 'LINK' },
  { symbol: 'uniswap', name: 'Uniswap', shortName: 'UNI' },
];

export function AddTransactionDialog({
  open,
  onOpenChange,
  portfolios,
  selectedPortfolioId,
  onTransactionAdded,
}: AddTransactionDialogProps) {
  const { currentUser } = useAuth();
  const { prices } = useCryptoPrices();
  const { addTransaction } = usePortfolio(selectedPortfolioId || 'main');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    portfolio_id: selectedPortfolioId || 'main',
    crypto_symbol: '',
    transaction_type: 'buy' as 'buy' | 'sell',
    amount: '',
    price_per_unit: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  // Auto-fill price when crypto is selected
  const handleCryptoChange = (symbol: string) => {
    setFormData(prev => ({ 
      ...prev, 
      crypto_symbol: symbol,
      price_per_unit: prices[symbol]?.current_price?.toString() || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await addTransaction(
        formData.crypto_symbol,
        formData.transaction_type,
        parseFloat(formData.amount),
        parseFloat(formData.price_per_unit)
      );

      if (success) {
        toast.success('Transação adicionada com sucesso!');
        onTransactionAdded();
        onOpenChange(false);
        
        // Reset form
        setFormData({
          portfolio_id: selectedPortfolioId || 'main',
          crypto_symbol: '',
          transaction_type: 'buy',
          amount: '',
          price_per_unit: '',
          transaction_date: new Date().toISOString().split('T')[0],
        });
      } else {
        toast.error('Erro ao adicionar transação');
      }
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao adicionar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova compra ou venda de criptomoeda ao seu portfólio
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="crypto">Criptomoeda</Label>
            <Select
              value={formData.crypto_symbol}
              onValueChange={handleCryptoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma criptomoeda" />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_ASSETS.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    {crypto.shortName} - {crypto.name}
                    {prices[crypto.symbol] && (
                      <span className="text-muted-foreground ml-2">
                        ${prices[crypto.symbol].current_price.toFixed(2)}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Transação</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value: 'buy' | 'sell') => setFormData(prev => ({ ...prev, transaction_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Compra</SelectItem>
                <SelectItem value="sell">Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Quantidade</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço por Unidade ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price_per_unit}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_unit: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data da Transação</Label>
            <Input
              id="date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}