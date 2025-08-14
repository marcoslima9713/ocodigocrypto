// Componente para roteamento protegido - apenas usuários logados podem acessar
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LockedOverlay from '@/components/LockedOverlay';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, loading, isMember, isFreeUser, allowedModules, freeAllowDashboard, freeAllowDCACalc, freeAllowPortfolio, freeAllowSentiment } = useAuth();
  const location = useLocation();

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

  // Controle de acesso por módulo para usuários gratuitos
  const path = location.pathname;
  const isModuleRoute = path.startsWith('/modulo/');
  const isHome = path === '/' || path === '';
  const isDashboard = path.startsWith('/dashboard');
  const isDCACalc = path.startsWith('/dca-calculator');
  const isPortfolio = path.startsWith('/portfolio');
  const isSentiment = path.startsWith('/sentimento');

  let showLock = false;
  if (isModuleRoute && !isMember) {
    const slug = path.replace('/modulo/', '');
    const hasAccess = isFreeUser && (allowedModules.includes(slug) || allowedModules.includes('*'));
    showLock = !hasAccess;
  }

  // Bloqueio de marketing para páginas específicas (Dashboard e DCA Calc) quando não-membro
  // Home page lock (marketing)
  if (!isMember && isHome) showLock = true;
  if (!isMember && isDashboard && freeAllowDashboard === false) showLock = true;
  if (!isMember && isDCACalc && freeAllowDCACalc === false) showLock = true;
  if (!isMember && isPortfolio && freeAllowPortfolio === false) showLock = true;
  if (!isMember && isSentiment && freeAllowSentiment === false) showLock = true;

  // Demais páginas permanecem visíveis para free, porém com overlay de bloqueio

  console.log('User authenticated, verificando permissões...');

  // Se não tiver acesso, não renderiza o conteúdo sensível
  if (showLock) {
    return (
      <div className="relative min-h-screen">
        <LockedOverlay />
      </div>
    );
  }

  // Acesso permitido: renderiza normalmente
  return <>{children}</>;
};