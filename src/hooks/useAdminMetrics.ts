import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  freeUsers: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  churnRate: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

export interface UserMetrics {
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
  is_active: boolean;
  subscription_type: string;
}

export interface RevenueData {
  week: string;
  revenue: number;
  new_subscriptions: number;
  renewals: number;
  total_payments: number;
  date_range: string;
}

export const useAdminMetrics = () => {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    freeUsers: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    averageRevenuePerUser: 0,
    conversionRate: 0,
    churnRate: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0
  });
  
  const [users, setUsers] = useState<UserMetrics[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const WEEKLY_PRICE = 19.90; // R$ 19,90 por semana

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar estatísticas básicas
      const [
        totalUsersResult,
        activeSubscriptionsResult,
        expiredSubscriptionsResult,
        freeUsersResult,
        weeklyPaymentsResult,
        monthlyPaymentsResult,
        totalPaymentsResult,
        previousWeekPaymentsResult,
        previousMonthPaymentsResult
      ] = await Promise.all([
        // Total de usuários
        supabase
          .from('members')
          .select('id', { count: 'exact' }),

        // Assinaturas ativas
        supabase
          .from('members')
          .select('id', { count: 'exact' })
          .eq('subscription_status', 'active')
          .gt('subscription_end_date', new Date().toISOString()),

        // Assinaturas expiradas
        supabase
          .from('members')
          .select('id', { count: 'exact' })
          .eq('subscription_status', 'expired'),

        // Usuários gratuitos
        supabase
          .from('free_users')
          .select('id', { count: 'exact' }),

        // Receita semanal (últimos 7 dias)
        supabase
          .from('subscription_payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

        // Receita mensal (últimos 30 dias)
        supabase
          .from('subscription_payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

        // Receita total
        supabase
          .from('subscription_payments')
          .select('amount')
          .eq('status', 'completed'),

        // Receita da semana anterior (para cálculo de crescimento)
        supabase
          .from('subscription_payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .lt('payment_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

        // Receita do mês anterior (para cálculo de crescimento)
        supabase
          .from('subscription_payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
          .lt('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Calcular receitas
      const weeklyRevenue = weeklyPaymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const monthlyRevenue = monthlyPaymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const totalRevenue = totalPaymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const previousWeekRevenue = previousWeekPaymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const previousMonthRevenue = previousMonthPaymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calcular métricas derivadas
      const totalUsers = totalUsersResult.data?.length || 0;
      const activeSubscriptions = activeSubscriptionsResult.data?.length || 0;
      const expiredSubscriptions = expiredSubscriptionsResult.data?.length || 0;
      const freeUsers = freeUsersResult.data?.length || 0;

      const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
      const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
      const churnRate = totalUsers > 0 ? (expiredSubscriptions / totalUsers) * 100 : 0;
      
      const weeklyGrowth = previousWeekRevenue > 0 ? ((weeklyRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 : 0;
      const monthlyGrowth = previousMonthRevenue > 0 ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

      setMetrics({
        totalUsers,
        activeSubscriptions,
        expiredSubscriptions,
        freeUsers,
        weeklyRevenue,
        monthlyRevenue,
        totalRevenue,
        averageRevenuePerUser,
        conversionRate,
        churnRate,
        weeklyGrowth,
        monthlyGrowth
      });

    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setError('Erro ao carregar métricas administrativas');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: members, error } = await supabase
        .from('members')
        .select(`
          id,
          email,
          full_name,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          payment_count,
          last_payment_date,
          created_at,
          is_active,
          subscription_type
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithCalculations = members?.map(member => {
        const endDate = new Date(member.subscription_end_date);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const totalPaid = (member.payment_count || 0) * WEEKLY_PRICE;

        return {
          ...member,
          days_remaining: daysRemaining,
          total_paid: totalPaid
        };
      }) || [];

      setUsers(usersWithCalculations);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar lista de usuários');
    }
  };

  const loadRevenueData = async () => {
    try {
      const weeks = [];
      
      // Últimas 12 semanas
      for (let i = 11; i >= 0; i--) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (i * 7));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        const { data: payments } = await supabase
          .from('subscription_payments')
          .select('amount, payment_date, status')
          .eq('status', 'completed')
          .gte('payment_date', startDate.toISOString())
          .lte('payment_date', endDate.toISOString());

        const revenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const totalPayments = payments?.length || 0;
        
        // Estimar novas assinaturas vs renovações baseado no valor
        const newSubscriptions = Math.round(revenue / WEEKLY_PRICE * 0.3); // Estimativa: 30% são novos
        const renewals = totalPayments - newSubscriptions;

        weeks.push({
          week: startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          revenue,
          new_subscriptions: Math.max(0, newSubscriptions),
          renewals: Math.max(0, renewals),
          total_payments: totalPayments,
          date_range: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`
        });
      }

      setRevenueData(weeks);
    } catch (err) {
      console.error('Erro ao carregar dados de receita:', err);
      setError('Erro ao carregar dados de receita');
    }
  };

  const refreshData = async () => {
    await Promise.all([
      loadMetrics(),
      loadUsers(),
      loadRevenueData()
    ]);
  };

  const exportUsersToCSV = (filteredUsers: UserMetrics[]) => {
    const csvContent = [
      ['Email', 'Nome', 'Status', 'Tipo', 'Dias Restantes', 'Total Pago', 'Pagamentos', 'Último Pagamento', 'Criado em'],
      ...filteredUsers.map(user => [
        user.email,
        user.full_name || '',
        user.subscription_status,
        user.subscription_type || 'weekly',
        user.days_remaining,
        `R$ ${user.total_paid.toFixed(2)}`,
        user.payment_count || 0,
        user.last_payment_date ? new Date(user.last_payment_date).toLocaleDateString('pt-BR') : '',
        new Date(user.created_at).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportRevenueToCSV = () => {
    const csvContent = [
      ['Semana', 'Receita', 'Novas Assinaturas', 'Renovações', 'Total Pagamentos', 'Período'],
      ...revenueData.map(week => [
        week.week,
        `R$ ${week.revenue.toFixed(2)}`,
        week.new_subscriptions,
        week.renewals,
        week.total_payments,
        week.date_range
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receita_semanal_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    metrics,
    users,
    revenueData,
    loading,
    error,
    refreshData,
    exportUsersToCSV,
    exportRevenueToCSV,
    WEEKLY_PRICE
  };
};
