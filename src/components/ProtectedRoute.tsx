// Componente para roteamento protegido - apenas usuários logados podem acessar
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser } = useAuth();

  // Se não estiver logado, redireciona para login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};