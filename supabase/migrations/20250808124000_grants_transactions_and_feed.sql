-- Garantir GRANTs para PostgREST

-- Permitir uso do schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Permissões nas tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT ON public.community_feed TO anon, authenticated;
GRANT SELECT ON public.user_privacy_settings TO authenticated;

-- Garantir que futuras tabelas também herdem privilégios (opcional)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon, authenticated;
