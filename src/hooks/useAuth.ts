import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth as useAppAuth } from '@/contexts/AuthContext';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'member' | 'user';
  created_at: string;
  updated_at: string;
}

// Hook para obter o papel do usuário - temporariamente simplificado para Supabase
export const useUserAuth = () => {
  const { currentUser } = useAppAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // Por enquanto, vamos usar um papel padrão 'user' para todos os usuários
        // até que a tabela user_roles seja corrigida
        const defaultRole: UserRole = {
          id: currentUser.id,
          user_id: currentUser.id,
          role: 'user', // Papel padrão
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setUserRole(defaultRole);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  const isAdmin = userRole?.role === 'admin';
  const isMember = isAdmin || userRole?.role === 'member';

  return {
    currentUser,
    userRole,
    isAdmin,
    isMember,
    isLoading,
  };
};
