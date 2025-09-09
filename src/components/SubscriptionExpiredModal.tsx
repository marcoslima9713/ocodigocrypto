import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar, Clock, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextWeekly";

interface SubscriptionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionExpiredModal = ({ isOpen, onClose }: SubscriptionExpiredModalProps) => {
  const { subscriptionStatus } = useAuth();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRenewSubscription = () => {
    // Redirecionar para o checkout
    window.open('https://seu-checkout.com', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            Assinatura Expirada
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Ícone de Aviso */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 border-2 border-red-800/50 mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          {/* Mensagem Principal */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Acesso Expirado
            </h3>
            <p className="text-zinc-400">
              Sua assinatura semanal expirou. Renove o pagamento para continuar acessando todo o conteúdo premium.
            </p>
          </div>

          {/* Informações da Assinatura */}
          {subscriptionStatus.endDate && (
            <Card className="bg-zinc-800/50 border-zinc-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  Expirou em:
                </div>
                <div className="text-white font-medium">
                  {formatDate(subscriptionStatus.endDate)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefícios da Renovação */}
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Benefícios da Assinatura Semanal:
            </h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Acesso completo a todos os módulos</li>
              <li>• Dashboard premium com análises avançadas</li>
              <li>• Calculadora DCA profissional</li>
              <li>• Portfolio tracking completo</li>
              <li>• Análise de sentimento do mercado</li>
              <li>• Suporte prioritário</li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Fechar
            </Button>
            <Button 
              onClick={handleRenewSubscription}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Renovar Agora
            </Button>
          </div>

          {/* Informação Adicional */}
          <div className="text-center">
            <p className="text-xs text-zinc-500">
              A renovação é automática e você terá acesso imediato após o pagamento.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
