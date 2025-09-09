import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign,
  Clock,
  AlertTriangle
} from "lucide-react";

interface UserStatsCardProps {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  newUsersThisWeek?: number;
  churnRate?: number;
}

export const UserStatsCard = ({
  totalUsers,
  activeSubscriptions,
  expiredSubscriptions,
  totalRevenue,
  newUsersThisWeek = 0,
  churnRate = 0
}: UserStatsCardProps) => {
  const activeRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
  const expiredRate = totalUsers > 0 ? (expiredSubscriptions / totalUsers) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          {newUsersThisWeek > 0 && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{newUsersThisWeek} esta semana
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeSubscriptions}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Progress value={activeRate} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground">{activeRate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assinaturas Expiradas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{expiredSubscriptions}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Progress value={expiredRate} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground">{expiredRate.toFixed(1)}%</span>
          </div>
          {churnRate > 0 && (
            <p className="text-xs text-red-500 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              {churnRate.toFixed(1)}% churn rate
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Média: R$ {totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : '0.00'} por usuário
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

interface SubscriptionAlertProps {
  expiringToday: number;
  expiringThisWeek: number;
}

export const SubscriptionAlert = ({ expiringToday, expiringThisWeek }: SubscriptionAlertProps) => {
  if (expiringToday === 0 && expiringThisWeek === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50 mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {expiringToday > 0 && (
            <div className="flex items-center justify-between p-2 bg-red-100 rounded-lg">
              <span className="text-red-800 font-medium">
                {expiringToday} assinatura{expiringToday > 1 ? 's' : ''} expira{expiringToday === 1 ? '' : 'm'} hoje
              </span>
              <Badge variant="destructive">Urgente</Badge>
            </div>
          )}
          {expiringThisWeek > 0 && (
            <div className="flex items-center justify-between p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-800 font-medium">
                {expiringThisWeek} assinatura{expiringThisWeek > 1 ? 's' : ''} expira{expiringThisWeek === 1 ? '' : 'm'} esta semana
              </span>
              <Badge className="bg-yellow-600">Atenção</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
