import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Image, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DCACryptocurrency {
  id: string;
  symbol: string;
  name: string;
  coin_gecko_id: string;
  image_url?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function DCACryptoManager() {
  const { toast } = useToast();
  const [cryptocurrencies, setCryptocurrencies] = useState<DCACryptocurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState<DCACryptocurrency | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    coin_gecko_id: '',
    image_url: '',
    is_active: true,
    order_index: 0
  });

  useEffect(() => {
    fetchCryptocurrencies();
  }, []);

  const fetchCryptocurrencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dca_cryptocurrencies')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setCryptocurrencies(data || []);
    } catch (error) {
      console.error('Erro ao buscar criptomoedas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as criptomoedas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCrypto) {
        // Update existing
        const { error } = await supabase
          .from('dca_cryptocurrencies')
          .update(formData)
          .eq('id', editingCrypto.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Criptomoeda atualizada com sucesso",
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('dca_cryptocurrencies')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Criptomoeda adicionada com sucesso",
        });
      }

      setIsDialogOpen(false);
      setEditingCrypto(null);
      resetForm();
      fetchCryptocurrencies();
    } catch (error) {
      console.error('Erro ao salvar criptomoeda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a criptomoeda",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (crypto: DCACryptocurrency) => {
    setEditingCrypto(crypto);
    setFormData({
      symbol: crypto.symbol,
      name: crypto.name,
      coin_gecko_id: crypto.coin_gecko_id,
      image_url: crypto.image_url || '',
      is_active: crypto.is_active,
      order_index: crypto.order_index
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta criptomoeda?')) return;

    try {
      const { error } = await supabase
        .from('dca_cryptocurrencies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Criptomoeda excluída com sucesso",
      });

      fetchCryptocurrencies();
    } catch (error) {
      console.error('Erro ao excluir criptomoeda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a criptomoeda",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      coin_gecko_id: '',
      image_url: '',
      is_active: true,
      order_index: 0
    });
  };

  const openNewDialog = () => {
    setEditingCrypto(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Criptomoedas Disponíveis</h3>
          <p className="text-sm text-muted-foreground">
            {cryptocurrencies.length} criptomoedas cadastradas
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Criptomoeda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cryptocurrencies.map((crypto) => (
          <Card key={crypto.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {crypto.image_url && (
                    <img 
                      src={crypto.image_url} 
                      alt={crypto.name} 
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div>
                    <CardTitle className="text-sm">{crypto.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
                  </div>
                </div>
                <Badge variant={crypto.is_active ? "default" : "secondary"}>
                  {crypto.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">CoinGecko ID:</span> {crypto.coin_gecko_id}
                </div>
                <div>
                  <span className="font-medium">Ordem:</span> {crypto.order_index}
                </div>
                {crypto.image_url && (
                  <div>
                    <span className="font-medium">Imagem:</span> 
                    <div className="mt-1">
                      <img 
                        src={crypto.image_url} 
                        alt={crypto.name} 
                        className="w-8 h-8 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(crypto)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(crypto.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCrypto ? 'Editar Criptomoeda' : 'Adicionar Criptomoeda'}
            </DialogTitle>
            <DialogDescription>
              Configure os dados da criptomoeda para a calculadora DCA
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Símbolo</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  placeholder="BTC"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Bitcoin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coin_gecko_id">CoinGecko ID</Label>
              <Input
                id="coin_gecko_id"
                value={formData.coin_gecko_id}
                onChange={(e) => setFormData({...formData, coin_gecko_id: e.target.value})}
                placeholder="bitcoin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://example.com/image.png"
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_index">Ordem</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value)})}
                  min="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.is_active ? "active" : "inactive"} 
                  onValueChange={(value) => setFormData({...formData, is_active: value === "active"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingCrypto ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> O CoinGecko ID deve corresponder ao identificador usado na API do CoinGecko. 
          Exemplos: "bitcoin", "ethereum", "solana". A imagem é opcional mas recomendada para melhor experiência do usuário.
        </AlertDescription>
      </Alert>
    </div>
  );
} 