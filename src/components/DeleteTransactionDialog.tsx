import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  transaction: {
    id: string;
    crypto_symbol: string;
    transaction_type: string;
    amount: number;
    price_usd: number;
    total_usd: number;
    transaction_date: string;
  } | null;
  loading?: boolean;
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  onConfirm,
  transaction,
  loading = false
}: DeleteTransactionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Confirmar Remoção
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Tem certeza que deseja remover esta transação? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Criptomoeda</span>
              <span className="font-medium text-white">{transaction.crypto_symbol}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Tipo</span>
              <span className={`font-medium ${transaction.transaction_type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {transaction.transaction_type === 'buy' ? 'Compra' : 'Venda'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Quantidade</span>
              <span className="font-medium text-white">
                {Number(transaction.amount).toFixed(6)} {transaction.crypto_symbol}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Preço</span>
              <span className="font-medium text-white">
                {formatCurrency(Number(transaction.price_usd))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="font-semibold text-white">
                {formatCurrency(Number(transaction.total_usd))}
              </span>
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-300">
                <p className="font-medium mb-1">Atenção!</p>
                <p>
                  A remoção desta transação afetará o cálculo do seu portfólio e pode alterar 
                  significativamente os valores de performance e distribuição dos ativos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting || loading}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Removendo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remover Transação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 