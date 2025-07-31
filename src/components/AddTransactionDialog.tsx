import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'UNI', name: 'Uniswap' },
];

export function AddTransactionDialog({
  open,
  onOpenChange,
  portfolios,
  selectedPortfolioId,
  onTransactionAdded,
}: AddTransactionDialogProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    portfolio_id: selectedPortfolioId || '',
    crypto_symbol: '',
    transaction_type: 'buy' as 'buy' | 'sell',
    amount: '',
    price_per_unit: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Por enquanto, simular criação de transação
      console.log('Transação criada:', {
        user_id: currentUser?.uid,
        portfolio_id: formData.portfolio_id,
        crypto_symbol: formData.crypto_symbol,
        transaction_type: formData.transaction_type,
        amount: parseFloat(formData.amount),
        price_per_unit: parseFloat(formData.price_per_unit),
        transaction_date: formData.transaction_date,
      });

      toast.success('Transação adicionada com sucesso!');
      onTransactionAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        portfolio_id: selectedPortfolioId || '',
        crypto_symbol: '',
        transaction_type: 'buy',
        amount: '',
        price_per_unit: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, crypto_symbol: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma criptomoeda" />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_ASSETS.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    {crypto.symbol} - {crypto.name}
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