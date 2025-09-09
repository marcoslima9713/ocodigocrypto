import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  UserCheck,
  UserX,
  Clock,
  CreditCard,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { AdminMetrics } from "@/hooks/useAdminMetrics";

interface AdminMetricsCardsProps {
  metrics: AdminMetrics;
  weeklyPrice: number;
}

export const AdminMetricsCards = ({ metrics, weeklyPrice }: AdminMetricsCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-zinc-400";
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total de Usuários */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-blue-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{metrics.totalUsers}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
              <UserCheck className="w-3 h-3 mr-1" />
              {metrics.activeSubscriptions} ativos
            </Badge>
            <Badge variant="secondary" className="bg-zinc-600/20 text-zinc-400 border-zinc-600/30">
              {metrics.freeUsers} gratuitos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Receita Semanal */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-green-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Receita Semanal</CardTitle>
          <DollarSign className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{formatCurrency(metrics.weeklyRevenue)}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex items-center gap-1 text-sm ${getGrowthColor(metrics.weeklyGrowth)}`}>
              {getGrowthIcon(metrics.weeklyGrowth)}
              {formatPercentage(metrics.weeklyGrowth)}
            </div>
            <span className="text-xs text-zinc-500">vs semana anterior</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            ~{Math.round(metrics.weeklyRevenue / weeklyPrice)} assinaturas
          </div>
        </CardContent>
      </Card>

      {/* Receita Mensal */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-yellow-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Receita Mensal</CardTitle>
          <TrendingUp className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{formatCurrency(metrics.monthlyRevenue)}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex items-center gap-1 text-sm ${getGrowthColor(metrics.monthlyGrowth)}`}>
              {getGrowthIcon(metrics.monthlyGrowth)}
              {formatPercentage(metrics.monthlyGrowth)}
            </div>
            <span className="text-xs text-zinc-500">vs mês anterior</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            ~{Math.round(metrics.monthlyRevenue / weeklyPrice)} assinaturas
          </div>
        </CardContent>
      </Card>

      {/* Receita Total */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-purple-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Receita Total</CardTitle>
          <CreditCard className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="text-xs text-zinc-500 mt-2">
            {formatCurrency(metrics.averageRevenuePerUser)} por usuário
          </div>
          <div className="text-xs text-zinc-500">
            {Math.round(metrics.totalRevenue / weeklyPrice)} pagamentos totais
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-cyan-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Taxa de Conversão</CardTitle>
          <Target className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{metrics.conversionRate.toFixed(1)}%</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant="secondary" 
              className={`${
                metrics.conversionRate >= 50 ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                metrics.conversionRate >= 25 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                'bg-red-600/20 text-red-400 border-red-600/30'
              }`}
            >
              {metrics.conversionRate >= 50 ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : metrics.conversionRate >= 25 ? (
                <AlertTriangle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {metrics.conversionRate >= 50 ? 'Excelente' : 
               metrics.conversionRate >= 25 ? 'Bom' : 'Baixo'}
            </Badge>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {metrics.activeSubscriptions} de {metrics.totalUsers} usuários
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Churn */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-red-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Taxa de Churn</CardTitle>
          <UserX className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{metrics.churnRate.toFixed(1)}%</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant="secondary" 
              className={`${
                metrics.churnRate <= 10 ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                metrics.churnRate <= 25 ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                'bg-red-600/20 text-red-400 border-red-600/30'
              }`}
            >
              {metrics.churnRate <= 10 ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : metrics.churnRate <= 25 ? (
                <AlertTriangle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {metrics.churnRate <= 10 ? 'Baixo' : 
               metrics.churnRate <= 25 ? 'Médio' : 'Alto'}
            </Badge>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {metrics.expiredSubscriptions} assinaturas expiradas
          </div>
        </CardContent>
      </Card>

      {/* Assinaturas Ativas */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-green-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Assinaturas Ativas</CardTitle>
          <UserCheck className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{metrics.activeSubscriptions}</div>
          <div className="text-xs text-zinc-500 mt-2">
            {((metrics.activeSubscriptions / metrics.totalUsers) * 100).toFixed(1)}% do total
          </div>
          <div className="text-xs text-zinc-500">
            Receita potencial: {formatCurrency(metrics.activeSubscriptions * weeklyPrice)}
          </div>
        </CardContent>
      </Card>

      {/* Assinaturas Expiradas */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-red-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Assinaturas Expiradas</CardTitle>
          <UserX className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{metrics.expiredSubscriptions}</div>
          <div className="text-xs text-zinc-500 mt-2">
            {((metrics.expiredSubscriptions / metrics.totalUsers) * 100).toFixed(1)}% do total
          </div>
          <div className="text-xs text-zinc-500">
            Oportunidade: {formatCurrency(metrics.expiredSubscriptions * weeklyPrice)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
