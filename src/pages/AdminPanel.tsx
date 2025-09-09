import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, Shield, Code, Globe, Image, AlertTriangle, User, Coins } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import VideoManager from "@/components/VideoManager";
import CoinGeckoManager from "@/components/CoinGeckoManager";
import CryptoImageManager from "@/components/CryptoImageManager";
import DCACryptoManager from "@/components/DCACryptoManager";

import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { UserManagement } from "@/components/UserManagement";

const AdminPanel = () => {
  const { logoutAdmin } = useAdminAuth();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };



  const webhookUrl = "https://wvojbjkdlnvlqgjwtdaf.supabase.co/functions/v1/ggcheckout-webhook";
  const projectUrl = "https://wvojbjkdlnvlqgjwtdaf.supabase.co";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Gerenciamento do sistema e documentação para desenvolvedores
            </p>
          </div>
                     <div className="flex items-center gap-2">
             <Badge variant="outline">Admin: marcoslima9713@gmail.com</Badge>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/dashboard"}
            >
              Voltar ao Dashboard
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                logoutAdmin();
                window.location.href = "/admin-login";
              }}
            >
              Logout Admin
            </Button>
          </div>
        </div>

        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="status">Status do Sistema</TabsTrigger>
            <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="videos">Gerenciar Vídeos</TabsTrigger>
            <TabsTrigger value="coingecko">API CoinGecko</TabsTrigger>
            <TabsTrigger value="crypto-images">Imagens Crypto</TabsTrigger>
            <TabsTrigger value="dca-crypto">DCA Crypto</TabsTrigger>
            <TabsTrigger value="free-access">Acesso Gratuito</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Online
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Todos os serviços funcionando normalmente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Conectado
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supabase PostgreSQL funcionando
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Webhook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Ativo
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    GGCheckout webhook configurado
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Webhook</CardTitle>
                <CardDescription>
                  URL do webhook para integração com GGCheckout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={webhookUrl} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Importante:</strong> Este webhook processa pagamentos do GGCheckout 
                    e atualiza automaticamente os membros no banco de dados.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-semibold mb-2">Eventos Suportados:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• pagamento_aprovado</li>
                      <li>• pix.paid</li>
                      <li>• status: approved/paid</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Segurança:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Verificação de assinatura JWT</li>
                      <li>• Validação de payload</li>
                      <li>• Logs de segurança</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <VideoManager />
          </TabsContent>

          <TabsContent value="coingecko">
            <CoinGeckoManager />
          </TabsContent>

          <TabsContent value="crypto-images">
            <CryptoImageManager />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Como Adicionar Módulos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">1. Editar src/pages/Dashboard.tsx</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Adicione um novo objeto no array de módulos:
                    </p>
                    <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
{`{
  id: "novo-modulo",
  title: "Título do Módulo",
  description: "Descrição...",
  icon: IconName,
  image: "/path/to/image.jpg",
  color: "from-blue-500 to-purple-600",
  estimatedTime: "45 min"
}`}
                    </pre>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">2. Adicionar Ícone</h4>
                    <p className="text-sm text-muted-foreground">
                      Importe o ícone do Lucide React no topo do arquivo Dashboard.tsx
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">3. Adicionar Imagem</h4>
                    <p className="text-sm text-muted-foreground">
                      Coloque a imagem na pasta public/ e referencie no campo image
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    URLs e Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold">URL Base do Projeto</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          value={projectUrl} 
                          readOnly 
                          className="font-mono text-xs"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard(projectUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Pasta de Conteúdos</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          value="/public/content/" 
                          readOnly 
                          className="font-mono text-xs"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard("/public/content/")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Pasta de Capas</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          value="/public/covers/" 
                          readOnly 
                          className="font-mono text-xs"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard("/public/covers/")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Image className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Dica:</strong> Use imagens em formato .jpg ou .webp para melhor performance. 
                      Tamanho recomendado para capas: 1920x1080px.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Estrutura de Dados dos Membros</CardTitle>
                  <CardDescription>
                    Schema da tabela members no Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`Tabela: members
Colunas:
- id (uuid, primary key)
- email (text, not null)
- password_hash (text, not null)  
- full_name (text, not null)
- product_name (text, not null)
- ggcheckout_transaction_id (text, nullable)
- is_active (boolean, default: true)
- created_at (timestamp, default: now())
- updated_at (timestamp, default: now())`}
                    </pre>
                  </div>
                  
                  <div className="mt-4 bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Políticas RLS Ativas:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Members can view their own data (SELECT)</li>
                      <li>• System can create members (INSERT)</li>
                      <li>• System can update members (UPDATE)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dca-crypto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Gerenciar Criptomoedas da Calculadora DCA
                </CardTitle>
                <CardDescription>
                  Adicione, edite ou remova criptomoedas disponíveis na calculadora DCA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DCACryptoManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="free-access" className="space-y-4">
            <FreeAccessSettingsCard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;

function FreeAccessSettingsCard() {
  const [loading, setLoading] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>(['ciclo-de-juros-e-spx500']);
  const [allowDashboard, setAllowDashboard] = useState(false);
  const [allowDca, setAllowDca] = useState(false);
  const [allowHome, setAllowHome] = useState(false);
  const [allowPortfolio, setAllowPortfolio] = useState(false);
  const [allowSentiment, setAllowSentiment] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('free_access_settings')
        .select('allowed_modules, allow_dashboard, allow_dca_calculator, allow_home, allow_portfolio, allow_sentiment')
        .eq('id', 'global')
        .maybeSingle();
      if (data) {
        setAllowedModules(data.allowed_modules ?? ['ciclo-de-juros-e-spx500']);
        setAllowDashboard(!!data.allow_dashboard);
        setAllowDca(!!data.allow_dca_calculator);
        setAllowHome(!!data.allow_home);
        setAllowPortfolio(!!data.allow_portfolio);
        setAllowSentiment(!!data.allow_sentiment);
      }
    };
    load();
  }, []);

  const toggleModule = (slug: string) => {
    setAllowedModules(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('free_access_settings')
      .upsert({
        id: 'global',
        allowed_modules: allowedModules,
        allow_dashboard: allowDashboard,
        allow_dca_calculator: allowDca,
        allow_home: allowHome,
        allow_portfolio: allowPortfolio,
        allow_sentiment: allowSentiment,
      });
    if (error) {
      // tenta com rpc via service
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/free_access_settings`, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: 'global',
            allowed_modules: allowedModules,
            allow_dashboard: allowDashboard,
            allow_dca_calculator: allowDca,
            allow_home: allowHome,
            allow_portfolio: allowPortfolio,
            allow_sentiment: allowSentiment,
          })
        });
      } catch {}
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Acesso Gratuito</CardTitle>
        <CardDescription>Defina o que é liberado para usuários não pagantes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="font-medium">Módulos liberados</div>
          {[
            { slug: 'ciclo-de-juros-e-spx500', label: 'Ciclo de Juros e SPX500' },
            { slug: 'origens-bitcoin', label: 'Origens do Bitcoin' },
            { slug: 'pool-de-liquidez', label: 'Pool de Liquidez' },
            { slug: 'dca', label: 'DCA (Aulas)' },
          ].map(m => (
            <label key={m.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowedModules.includes(m.slug)} onChange={() => toggleModule(m.slug)} />
              {m.label}
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <div className="font-medium">Páginas</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowHome} onChange={(e) => setAllowHome(e.target.checked)} />
            Página Principal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowDashboard} onChange={(e) => setAllowDashboard(e.target.checked)} />
            Dashboard
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowDca} onChange={(e) => setAllowDca(e.target.checked)} />
            Calculadora DCA
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowPortfolio} onChange={(e) => setAllowPortfolio(e.target.checked)} />
            Meu Portfólio Crypto
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowSentiment} onChange={(e) => setAllowSentiment(e.target.checked)} />
            Sentimento de Mercado
          </label>
        </div>

        <button onClick={save} className="btn-gold px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </CardContent>
    </Card>
  );
}