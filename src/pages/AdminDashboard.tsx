import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  CreditCard,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContextWeekly";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { AdminMetricsCards } from "@/components/AdminMetricsCards";
import { AdminCharts } from "@/components/AdminCharts";

interface UserStats {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  freeUsers: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  subscription_status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  payment_count: number;
  last_payment_date: string;
  created_at: string;
  days_remaining: number;
  total_paid: number;
}

interface WeeklyRevenue {
  week: string;
  revenue: number;
  new_subscriptions: number;
  renewals: number;
}

export default function AdminDashboard() {
  const { currentUser, isMember } = useAuth();
  const { 
    metrics, 
    users, 
    revenueData, 
    loading, 
    error, 
    refreshData, 
    exportUsersToCSV, 
    exportRevenueToCSV,
    WEEKLY_PRICE 
  } = useAdminMetrics();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Verificar se é admin
  useEffect(() => {
    if (!currentUser || !isMember) {
      window.location.href = "/dashboard";
      return;
    }
  }, [currentUser, isMember]);

  // Filtrar e ordenar usuários
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.subscription_status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof UserData];
      const bValue = b[sortBy as keyof UserData];
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'active' && daysRemaining > 0) {
      return <Badge variant="default" className="bg-green-600">Ativo</Badge>;
    } else if (status === 'expired' || daysRemaining <= 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else {
      return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Carregando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
            <p className="text-zinc-400 mt-2">Monitoramento de usuários e receita semanal</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={refreshData} 
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              onClick={() => exportUsersToCSV(filteredUsers)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Usuários
            </Button>
            <Button 
              onClick={exportRevenueToCSV}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Receita
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <AdminMetricsCards metrics={metrics} weeklyPrice={WEEKLY_PRICE} />

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border-zinc-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-zinc-800">
              <Users className="w-4 h-4 mr-2" />
              Usuários ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-zinc-800">
              <DollarSign className="w-4 h-4 mr-2" />
              Receita Semanal
            </TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:bg-zinc-800">
              <BarChart3 className="w-4 h-4 mr-2" />
              Gráficos
            </TabsTrigger>
          </TabsList>

          {/* Tab Usuários */}
          <TabsContent value="users" className="mt-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <CardTitle className="text-white">Lista de Usuários</CardTitle>
                  
                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por email ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white w-full sm:w-64"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40 bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="expired">Expirados</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-40 bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Data de Criação</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="subscription_status">Status</SelectItem>
                        <SelectItem value="total_paid">Total Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-3 px-4 text-zinc-400">Email</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Nome</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Status</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Dias Restantes</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Total Pago</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Último Pagamento</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                          <td className="py-3 px-4 text-white">{user.email}</td>
                          <td className="py-3 px-4 text-zinc-300">{user.full_name || '-'}</td>
                          <td className="py-3 px-4">
                            {getStatusBadge(user.subscription_status, user.days_remaining)}
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {user.days_remaining > 0 ? (
                              <span className="text-green-400">{user.days_remaining} dias</span>
                            ) : (
                              <span className="text-red-400">Expirado</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-green-400 font-medium">
                            {formatCurrency(user.total_paid)}
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {user.last_payment_date ? 
                              new Date(user.last_payment_date).toLocaleDateString('pt-BR') : 
                              '-'
                            }
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-zinc-400">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Receita */}
          <TabsContent value="revenue" className="mt-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Receita Semanal - Últimas 12 Semanas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-3 px-4 text-zinc-400">Semana</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Receita</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Novas Assinaturas</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Renovações</th>
                        <th className="text-left py-3 px-4 text-zinc-400">Total de Pagamentos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyRevenue.map((week, index) => (
                        <tr key={index} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                          <td className="py-3 px-4 text-white">{week.week}</td>
                          <td className="py-3 px-4 text-green-400 font-medium">
                            {formatCurrency(week.revenue)}
                          </td>
                          <td className="py-3 px-4 text-blue-400">{week.new_subscriptions}</td>
                          <td className="py-3 px-4 text-yellow-400">{week.renewals}</td>
                          <td className="py-3 px-4 text-zinc-300">
                            {week.new_subscriptions + week.renewals}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Gráficos */}
          <TabsContent value="charts" className="mt-6">
            <AdminCharts revenueData={revenueData} metrics={metrics} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
