import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextWeekly";

export const SubscriptionStatus = () => {
  const { subscriptionStatus, isMember, isFreeUser } = useAuth();

  if (!isMember && !isFreeUser) {
    return null;
  }

  const getStatusColor = () => {
    if (subscriptionStatus.isExpired) return "destructive";
    if (subscriptionStatus.daysRemaining <= 2) return "destructive";
    if (subscriptionStatus.daysRemaining <= 5) return "secondary";
    return "default";
  };

  const getStatusIcon = () => {
    if (subscriptionStatus.isExpired) return <XCircle className="w-4 h-4" />;
    if (subscriptionStatus.daysRemaining <= 2) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (subscriptionStatus.isExpired) return "Expirada";
    if (subscriptionStatus.daysRemaining <= 2) return "Expirando em breve";
    return "Ativa";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-[0_0_0_1px_rgba(39,39,42,0.6)]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/10 ring-1 ring-blue-500/30">
            <Calendar className="w-5 h-5 text-blue-400" />
          </span>
          Status da Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isMember && subscriptionStatus.isActive ? (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor()} className="flex items-center gap-1">
                {getStatusIcon()}
                {getStatusText()}
              </Badge>
              {subscriptionStatus.daysRemaining > 0 && (
                <span className="text-sm text-zinc-400">
                  {subscriptionStatus.daysRemaining} dia(s) restante(s)
                </span>
              )}
            </div>

            {/* Informações da Assinatura */}
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" />
                    Válido até:
                  </div>
                  <div className="text-white font-medium">
                    {subscriptionStatus.endDate ? formatDate(subscriptionStatus.endDate) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    Tipo:
                  </div>
                  <div className="text-white font-medium">
                    Assinatura Semanal
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de Expiração */}
            {subscriptionStatus.daysRemaining <= 2 && subscriptionStatus.daysRemaining > 0 && (
              <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-orange-400 font-medium mb-1">
                      Assinatura expirando em breve
                    </h4>
                    <p className="text-orange-300 text-sm">
                      Sua assinatura expira em {subscriptionStatus.daysRemaining} dia(s). 
                      Renove o pagamento para continuar o acesso completo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Renovação */}
            <div className="pt-2">
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  // Aqui você pode redirecionar para a página de pagamento
                  window.open('https://seu-checkout.com', '_blank');
                }}
              >
                🔄 Renovar Assinatura
              </Button>
            </div>
          </div>
        ) : isMember && subscriptionStatus.isExpired ? (
          <div className="space-y-4">
            {/* Status Expirado */}
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Expirada
              </Badge>
            </div>

            {/* Aviso de Expiração */}
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-medium mb-1">
                    Assinatura Expirada
                  </h4>
                  <p className="text-red-300 text-sm">
                    Sua assinatura expirou. Renove o pagamento para continuar o acesso completo à plataforma.
                  </p>
                </div>
              </div>
            </div>

            {/* Informações da Última Assinatura */}
            {subscriptionStatus.endDate && (
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <div className="text-sm text-zinc-400 mb-1">
                  Expirou em:
                </div>
                <div className="text-white font-medium">
                  {formatDate(subscriptionStatus.endDate)}
                </div>
              </div>
            )}

            {/* Botão de Renovação */}
            <div className="pt-2">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  // Aqui você pode redirecionar para a página de pagamento
                  window.open('https://seu-checkout.com', '_blank');
                }}
              >
                🔄 Renovar Assinatura
              </Button>
            </div>
          </div>
        ) : isFreeUser ? (
          <div className="space-y-4">
            {/* Status Usuário Gratuito */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Usuário Gratuito
              </Badge>
            </div>

            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-medium mb-1">
                    Acesso Limitado
                  </h4>
                  <p className="text-blue-300 text-sm">
                    Você tem acesso limitado ao conteúdo. Faça uma assinatura semanal para acessar todo o conteúdo premium.
                  </p>
                </div>
              </div>
            </div>

            {/* Botão de Assinatura */}
            <div className="pt-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // Aqui você pode redirecionar para a página de pagamento
                  window.open('https://seu-checkout.com', '_blank');
                }}
              >
                💎 Fazer Assinatura Semanal
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
