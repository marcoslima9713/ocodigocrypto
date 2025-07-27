import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, XCircle, Shield, Code, Globe, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    if (email === "marcoslima9713@gmail.com" && password === "Bitcoin2026!") {
      setIsAuthenticated(true);
      toast({
        title: "Acesso autorizado",
        description: "Bem-vindo ao painel administrativo",
      });
    } else {
      toast({
        title: "Acesso negado",
        description: "Credenciais inválidas",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Painel Administrativo</CardTitle>
            <CardDescription>
              Acesso restrito para administradores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Button 
            variant="outline" 
            onClick={() => setIsAuthenticated(false)}
          >
            Sair
          </Button>
        </div>

        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status do Sistema</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;