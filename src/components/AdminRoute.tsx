// Componente para roteamento administrativo - apenas email específico pode acessar
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdminLoggedIn } = useAdminAuth();

  // Se não estiver logado como admin, redireciona para login administrativo
  if (!isAdminLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}; 