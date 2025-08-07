import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Image, Upload, Trash2, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CryptoImage {
  id: string;
  symbol: string;
  name: string;
  image_url: string;
  created_at: string;
}

const CryptoImageManager = () => {
  const [cryptoImages, setCryptoImages] = useState<CryptoImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCrypto, setNewCrypto] = useState({
    symbol: '',
    name: '',
    image_url: ''
  });
  const [editCrypto, setEditCrypto] = useState({
    symbol: '',
    name: '',
    image_url: ''
  });

  const { toast } = useToast();

  // Fetch crypto images
  const fetchCryptoImages = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_images')
        .select('*')
        .order('symbol');

      if (error) throw error;
      setCryptoImages(data || []);
    } catch (error) {
      console.error('Error fetching crypto images:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar imagens das criptomoedas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoImages();
  }, []);

  // Add new crypto image
  const handleAddCrypto = async () => {
    if (!newCrypto.symbol || !newCrypto.name || !newCrypto.image_url) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase
        .from('crypto_images')
        .insert([newCrypto]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imagem da criptomoeda adicionada",
      });

      setNewCrypto({ symbol: '', name: '', image_url: '' });
      fetchCryptoImages();
    } catch (error) {
      console.error('Error adding crypto image:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar imagem da criptomoeda",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Update crypto image
  const handleUpdateCrypto = async (id: string) => {
    if (!editCrypto.symbol || !editCrypto.name || !editCrypto.image_url) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase
        .from('crypto_images')
        .update(editCrypto)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imagem da criptomoeda atualizada",
      });

      setEditingId(null);
      setEditCrypto({ symbol: '', name: '', image_url: '' });
      fetchCryptoImages();
    } catch (error) {
      console.error('Error updating crypto image:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar imagem da criptomoeda",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete crypto image
  const handleDeleteCrypto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    setUploading(true);
    try {
      const { error } = await supabase
        .from('crypto_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imagem da criptomoeda excluída",
      });

      fetchCryptoImages();
    } catch (error) {
      console.error('Error deleting crypto image:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir imagem da criptomoeda",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Start editing
  const handleEdit = (crypto: CryptoImage) => {
    setEditingId(crypto.id);
    setEditCrypto({
      symbol: crypto.symbol,
      name: crypto.name,
      image_url: crypto.image_url
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCrypto({ symbol: '', name: '', image_url: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Imagens das Criptomoedas</h2>
          <p className="text-muted-foreground">
            Adicione ou edite as imagens das criptomoedas exibidas no dashboard
          </p>
        </div>
      </div>

      {/* Add new crypto image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Nova Criptomoeda
          </CardTitle>
          <CardDescription>
            Adicione uma nova criptomoeda com sua imagem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="symbol">Símbolo</Label>
              <Input
                id="symbol"
                placeholder="BTC"
                value={newCrypto.symbol}
                onChange={(e) => setNewCrypto({ ...newCrypto, symbol: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Bitcoin"
                value={newCrypto.name}
                onChange={(e) => setNewCrypto({ ...newCrypto, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                placeholder="https://example.com/image.png"
                value={newCrypto.image_url}
                onChange={(e) => setNewCrypto({ ...newCrypto, image_url: e.target.value })}
              />
            </div>
          </div>
          <Button 
            onClick={handleAddCrypto} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Criptomoeda
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing crypto images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cryptoImages.map((crypto) => (
          <Card key={crypto.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={crypto.image_url}
                    alt={crypto.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div>
                    <CardTitle className="text-lg">{crypto.symbol}</CardTitle>
                    <CardDescription>{crypto.name}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === crypto.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateCrypto(crypto.id)}
                        disabled={uploading}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(crypto)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCrypto(crypto.id)}
                        disabled={uploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === crypto.id ? (
                <div className="space-y-3">
                  <div>
                    <Label>Símbolo</Label>
                    <Input
                      value={editCrypto.symbol}
                      onChange={(e) => setEditCrypto({ ...editCrypto, symbol: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={editCrypto.name}
                      onChange={(e) => setEditCrypto({ ...editCrypto, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>URL da Imagem</Label>
                    <Input
                      value={editCrypto.image_url}
                      onChange={(e) => setEditCrypto({ ...editCrypto, image_url: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <img
                    src={crypto.image_url}
                    alt={crypto.name}
                    className="w-full h-32 object-contain rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="text-xs text-muted-foreground break-all">
                    {crypto.image_url}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cryptoImages.length === 0 && (
        <Alert>
          <AlertDescription>
            Nenhuma imagem de criptomoeda encontrada. Adicione a primeira imagem acima.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CryptoImageManager; 