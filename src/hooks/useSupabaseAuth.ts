import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook simples que apenas expõe o usuário da sessão Supabase
 * (fornecido pelo AuthContext) e registra mudanças para debug.
 */
export const useSupabaseAuth = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.id) {
      console.log('[SupabaseAuth] session user:', currentUser.id);
    }
  }, [currentUser?.id]);

  return currentUser;
}; 