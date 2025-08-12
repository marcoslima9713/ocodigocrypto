import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPrivacySettings } from '@/types/database';

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

      // Buscar configurações de privacidade (sem gerar 406 quando não há linha)
      const { data, error: fetchError } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Erro ao buscar configurações: ${fetchError.message}`);
      }

      if (!data) {
        // Criar configuração padrão se não existir
        const { data: newSettings, error: upsertError } = await supabase
          .from('user_privacy_settings')
          .upsert({
            user_id: user.id,
            show_in_community_feed: true
          })
          .select()
          .single();

        if (upsertError) {
          throw new Error(`Erro ao criar configurações: ${upsertError.message}`);
        }

        setPrivacySettings(newSettings);
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

      // Upsert garante criação/atualização sem 406 e respeita RLS do próprio usuário
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: user.id,
          ...settings
        })
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
