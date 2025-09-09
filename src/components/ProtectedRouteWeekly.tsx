import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContextWeekly";
import { SubscriptionExpiredModal } from "./SubscriptionExpiredModal";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { 
    currentUser, 
    loading, 
    isMember, 
    isFreeUser, 
    allowedModules, 
    freeAllowDashboard, 
    freeAllowDCACalc, 
    freeAllowPortfolio, 
    freeAllowSentiment,
    subscriptionStatus 
  } = useAuth();
  
  const location = useLocation();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, redireciona para login
  if (!currentUser) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Verificar se assinatura expirou para membros
  useEffect(() => {
    if (isMember && subscriptionStatus.isExpired) {
      setShowExpiredModal(true);
    }
  }, [isMember, subscriptionStatus.isExpired]);

  // Controle de acesso por módulo para usuários gratuitos
  const path = location.pathname;
  const isModuleRoute = path.startsWith('/modulo/');
  const isHome = path === '/' || path === '';
  const isDashboard = path.startsWith('/dashboard');
  const isDCACalc = path.startsWith('/dca-calculator');
  const isPortfolio = path.startsWith('/portfolio');
  const isSentiment = path.startsWith('/sentimento');

  let showLock = false;
  let lockReason = '';

  // Verificar acesso para usuários gratuitos
  if (!isMember && isFreeUser) {
    if (isModuleRoute) {
      const slug = path.replace('/modulo/', '');
      const hasAccess = allowedModules.includes(slug) || allowedModules.includes('*');
      if (!hasAccess) {
        showLock = true;
        lockReason = 'Este módulo não está disponível no seu plano gratuito.';
      }
    }

    // Bloqueio de páginas específicas para usuários gratuitos
    if (isHome) {
      showLock = true;
      lockReason = 'Faça uma assinatura semanal para acessar o dashboard completo.';
    }
    if (isDashboard && !freeAllowDashboard) {
      showLock = true;
      lockReason = 'O dashboard completo está disponível apenas para assinantes.';
    }
    if (isDCACalc && !freeAllowDCACalc) {
      showLock = true;
      lockReason = 'A calculadora DCA profissional está disponível apenas para assinantes.';
    }
    if (isPortfolio && !freeAllowPortfolio) {
      showLock = true;
      lockReason = 'O portfolio tracking completo está disponível apenas para assinantes.';
    }
    if (isSentiment && !freeAllowSentiment) {
      showLock = true;
      lockReason = 'A análise de sentimento está disponível apenas para assinantes.';
    }
  }

  // Se mostrar bloqueio, renderizar tela de bloqueio
  if (showLock) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-orange-900/20 border-2 border-orange-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              🔒 Conteúdo Premium
            </h2>
            
            <p className="text-zinc-400 mb-6">
              {lockReason}
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => window.open('https://seu-checkout.com', '_blank')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                💎 Fazer Assinatura Semanal
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                ← Voltar
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
              <h3 className="text-blue-400 font-medium mb-2">
                🎯 Benefícios da Assinatura Semanal:
              </h3>
              <ul className="text-blue-300 text-sm space-y-1 text-left">
                <li>• Acesso completo a todos os módulos</li>
                <li>• Dashboard premium com análises avançadas</li>
                <li>• Calculadora DCA profissional</li>
                <li>• Portfolio tracking completo</li>
                <li>• Análise de sentimento do mercado</li>
                <li>• Suporte prioritário</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <SubscriptionExpiredModal 
        isOpen={showExpiredModal} 
        onClose={() => setShowExpiredModal(false)} 
      />
    </>
  );
};
