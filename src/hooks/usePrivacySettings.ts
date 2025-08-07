import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPrivacySettings } from '@/integrations/supabase/types';

interface UsePrivacySettingsReturn {
  privacySettings: UserPrivacySettings | null;
  loading: boolean;
  error: string | null;
  updatePrivacySettings: (settings: Partial<UserPrivacySettings>) => Promise<void>;
  toggleCommunityFeed: () => Promise<void>;
  isPublic: boolean;
}

export function usePrivacySettings(): UsePrivacySettingsReturn {
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar configurações de privacidade do usuário
  const fetchPrivacySettings = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar configurações de privacidade
      const { data, error: fetchError } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // Se não existir, criar configuração padrão
        if (fetchError.code === 'PGRST116') {
          const { data: newSettings, error: insertError } = await supabase
            .from('user_privacy_settings')
            .insert({
              user_id: user.id,
              show_in_community_feed: true
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Erro ao criar configurações: ${insertError.message}`);
          }

          setPrivacySettings(newSettings);
        } else {
          throw new Error(`Erro ao buscar configurações: ${fetchError.message}`);
        }
      } else {
        setPrivacySettings(data);
      }
    } catch (err) {
      console.error('Erro ao buscar configurações de privacidade:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar configurações de privacidade
  const updatePrivacySettings = useCallback(async (settings: Partial<UserPrivacySettings>) => {
    try {
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('user_privacy_settings')
        .update(settings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar configurações: ${error.message}`);
      }

      setPrivacySettings(data);
    } catch (err) {
      console.error('Erro ao atualizar configurações de privacidade:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      throw err;
    }
  }, []);

  // Toggle para mostrar/ocultar do feed da comunidade
  const toggleCommunityFeed = useCallback(async () => {
    if (!privacySettings) return;

    try {
      await updatePrivacySettings({
        show_in_community_feed: !privacySettings.show_in_community_feed
      });
    } catch (err) {
      console.error('Erro ao alternar visibilidade no feed:', err);
    }
  }, [privacySettings, updatePrivacySettings]);

  // Carregar configurações iniciais
  useEffect(() => {
    fetchPrivacySettings();
  }, [fetchPrivacySettings]);

  return {
    privacySettings,
    loading,
    error,
    updatePrivacySettings,
    toggleCommunityFeed,
    isPublic: privacySettings?.show_in_community_feed ?? false
  };
}
