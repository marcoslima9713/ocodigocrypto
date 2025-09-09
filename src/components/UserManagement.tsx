import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Calendar, 
  DollarSign, 
  Clock, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserStatsCard, SubscriptionAlert } from "./UserStatsCard";

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subscription_status?: string;
  subscription_end_date?: string;
  days_remaining?: number;
  last_payment_date?: string;
  last_payment_amount?: number;
  total_payments?: number;
  is_member?: boolean;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  transaction_id?: string;
  payment_method?: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPayments, setUserPayments] = useState<Payment[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const { toast } = useToast();

  // Formulário para adicionar usuário
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    subscription_days: 7
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Buscar usuários da tabela members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*');

      if (membersError) {
        throw membersError;
      }

        const usersWithSubscriptions = await Promise.all(
          (members || []).map(async (member) => {
            // Buscar assinatura semanal
            const { data: subscription } = await supabase
              .from('weekly_subscriptions')
              .select('*')
              .eq('user_id', member.auth_user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Buscar último pagamento
            const { data: lastPayment } = await supabase
              .from('subscription_payments')
              .select('*')
              .eq('user_id', member.auth_user_id)
              .order('payment_date', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Contar total de pagamentos
            const { count: totalPayments } = await supabase
              .from('subscription_payments')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', member.auth_user_id)
              .eq('status', 'completed');

            const daysRemaining = subscription && subscription.end_date 
              ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
              : 0;

            return {
              id: member.auth_user_id || member.id,
              email: member.email || 'Sem email',
              full_name: member.full_name || 'Sem nome',
              created_at: member.created_at,
              subscription_status: subscription?.subscription_status || 'none',
              subscription_end_date: subscription?.end_date,
              days_remaining: daysRemaining,
              last_payment_date: lastPayment?.payment_date,
              last_payment_amount: lastPayment?.amount,
              total_payments: totalPayments || 0,
              is_member: member.is_active || false
            };
          })
        );

        setUsers(usersWithSubscriptions);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPayments = async (userId: string) => {
    try {
      const { data: payments, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setUserPayments(payments || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de pagamentos",
        variant: "destructive"
      });
    }
  };

  const addUser = async () => {
    if (!newUser.email || !newUser.full_name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Gerar um UUID para o usuário
      const userId = crypto.randomUUID();
      
      // Criar assinatura semanal
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + newUser.subscription_days);

      const { error: subscriptionError } = await supabase
        .from('weekly_subscriptions')
        .insert({
          user_id: userId,
          email: newUser.email,
          full_name: newUser.full_name,
          subscription_status: 'active',
          end_date: endDate.toISOString()
        });

      if (subscriptionError) throw subscriptionError;

      // Adicionar à tabela members
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          auth_user_id: userId,
          email: newUser.email,
          full_name: newUser.full_name,
          password_hash: 'manual_created',
          product_name: 'Manual Admin Creation',
          is_active: true
        });

      if (memberError) {
        console.warn('Erro ao adicionar à tabela members:', memberError);
        // Tentar sem auth_user_id
        const { error: memberError2 } = await supabase
          .from('members')
          .insert({
            email: newUser.email,
            full_name: newUser.full_name,
            password_hash: 'manual_created',
            product_name: 'Manual Admin Creation',
            is_active: true
          });
        
        if (memberError2) throw memberError2;
      }

      toast({
        title: "Sucesso",
        description: "Usuário adicionado com sucesso!"
      });

      setNewUser({ email: "", full_name: "", subscription_days: 7 });
      setShowAddUser(false);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar usuário",
        variant: "destructive"
      });
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      // Remover assinaturas relacionadas
      const { error: subscriptionError } = await supabase
        .from('weekly_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (subscriptionError) console.warn('Erro ao remover assinaturas:', subscriptionError);

      // Remover pagamentos relacionados
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .delete()
        .eq('user_id', userId);

      if (paymentError) console.warn('Erro ao remover pagamentos:', paymentError);

      // Remover da tabela members
      const { error: memberError } = await supabase
        .from('members')
        .delete()
        .eq('auth_user_id', userId);

      if (memberError) {
        // Tentar remover por ID se auth_user_id não funcionar
        const { error: memberError2 } = await supabase
          .from('members')
          .delete()
          .eq('id', userId);
        
        if (memberError2) throw memberError2;
      }

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso!"
      });

      loadUsers();
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover usuário",
        variant: "destructive"
      });
    }
  };

  const updateSubscription = async (userId: string, days: number) => {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { error } = await supabase
        .from('weekly_subscriptions')
        .upsert({
          user_id: userId,
          subscription_status: 'active',
          end_date: endDate.toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Assinatura atualizada para ${days} dias`
      });

      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar assinatura:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar assinatura",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, daysRemaining?: number) => {
    if (status === 'active' && daysRemaining && daysRemaining > 0) {
      return <Badge className="bg-green-600">Ativo ({daysRemaining}d)</Badge>;
    } else if (status === 'expired' || daysRemaining === 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="secondary">Cancelado</Badge>;
    } else {
      return <Badge variant="outline">Sem assinatura</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Nome', 'Status', 'Dias Restantes', 'Último Pagamento', 'Total Pagamentos', 'Criado em'].join(','),
      ...filteredUsers.map(user => [
        user.email,
        user.full_name,
        user.subscription_status,
        user.days_remaining || 0,
        user.last_payment_date ? new Date(user.last_payment_date).toLocaleDateString('pt-BR') : 'Nunca',
        user.total_payments || 0,
        new Date(user.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeSubscriptions = users.filter(u => u.subscription_status === 'active' && (u.days_remaining || 0) > 0).length;
  const expiredSubscriptions = users.filter(u => u.subscription_status === 'expired' || (u.days_remaining || 0) === 0).length;
  const totalRevenue = users.reduce((total, user) => total + ((user.last_payment_amount || 0) * (user.total_payments || 0)), 0);
  
  const expiringToday = users.filter(u => (u.days_remaining || 0) === 0 && u.subscription_status === 'active').length;
  const expiringThisWeek = users.filter(u => (u.days_remaining || 0) <= 7 && (u.days_remaining || 0) > 0 && u.subscription_status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <UserStatsCard 
        totalUsers={users.length}
        activeSubscriptions={activeSubscriptions}
        expiredSubscriptions={expiredSubscriptions}
        totalRevenue={totalRevenue}
      />

      {/* Alertas */}
      <SubscriptionAlert 
        expiringToday={expiringToday}
        expiringThisWeek={expiringThisWeek}
      />

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
          <CardDescription>
            Visualize, adicione, remova e gerencie assinaturas dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="none">Sem assinatura</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={loadUsers} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>

              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Crie um novo usuário com assinatura ativa
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="usuario@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input
                        id="full_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                        placeholder="Nome do usuário"
                      />
                    </div>
                    
                    
                    <div>
                      <Label htmlFor="subscription_days">Dias de Assinatura</Label>
                      <Select 
                        value={newUser.subscription_days.toString()} 
                        onValueChange={(value) => setNewUser({...newUser, subscription_days: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 dias (1 semana)</SelectItem>
                          <SelectItem value="14">14 dias (2 semanas)</SelectItem>
                          <SelectItem value="30">30 dias (1 mês)</SelectItem>
                          <SelectItem value="90">90 dias (3 meses)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={addUser} className="flex-1">
                        Criar Usuário
                      </Button>
                      <Button onClick={() => setShowAddUser(false)} variant="outline">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabela de usuários */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Pagamento</TableHead>
                  <TableHead>Total Pagamentos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          {searchTerm || statusFilter !== "all" 
                            ? "Nenhum usuário encontrado com os filtros aplicados" 
                            : "Nenhum usuário cadastrado ainda"
                          }
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                          <Button 
                            onClick={() => setShowAddUser(true)}
                            variant="outline"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Adicionar Primeiro Usuário
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        {getStatusBadge(user.subscription_status || 'none', user.days_remaining)}
                      </TableCell>
                      <TableCell>
                        {user.last_payment_date ? (
                          <div>
                            <div>R$ {user.last_payment_amount?.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(user.last_payment_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>{user.total_payments || 0}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              loadUserPayments(user.id);
                              setShowUserDetails(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          <Select onValueChange={(days) => updateSubscription(user.id, parseInt(days))}>
                            <SelectTrigger className="w-20 h-8">
                              <Edit className="h-3 w-3" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">+7d</SelectItem>
                              <SelectItem value="14">+14d</SelectItem>
                              <SelectItem value="30">+30d</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeUser(user.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes do usuário */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas e histórico de pagamentos
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <div className="font-medium">{selectedUser.email}</div>
                  </div>
                  <div>
                    <Label>Nome</Label>
                    <div className="font-medium">{selectedUser.full_name}</div>
                  </div>
                  <div>
                    <Label>Status da Assinatura</Label>
                    <div>{getStatusBadge(selectedUser.subscription_status || 'none', selectedUser.days_remaining)}</div>
                  </div>
                  <div>
                    <Label>Data de Expiração</Label>
                    <div className="font-medium">
                      {selectedUser.subscription_end_date 
                        ? new Date(selectedUser.subscription_end_date).toLocaleDateString('pt-BR')
                        : 'Não definida'
                      }
                    </div>
                  </div>
                  <div>
                    <Label>Membro Ativo</Label>
                    <div>
                      {selectedUser.is_member ? (
                        <Badge className="bg-green-600">Sim</Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Criado em</Label>
                    <div className="font-medium">
                      {new Date(selectedUser.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="payments" className="space-y-4">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>ID Transação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum pagamento encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        userPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.payment_date).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={payment.status === 'completed' ? 'default' : 'destructive'}
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {payment.transaction_id || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> As ações abaixo são irreversíveis. Use com cuidado.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => updateSubscription(selectedUser.id, 7)}
                  >
                    Estender +7 dias
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateSubscription(selectedUser.id, 30)}
                  >
                    Estender +30 dias
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      removeUser(selectedUser.id);
                      setShowUserDetails(false);
                    }}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remover Usuário
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
