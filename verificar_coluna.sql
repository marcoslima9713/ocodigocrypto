-- Script para verificar se a coluna auth_user_id existe na tabela members
-- Execute este script no SQL Editor do Supabase

-- Verificar estrutura da tabela members
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se a coluna auth_user_id existe especificamente
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'members' 
AND table_schema = 'public'
AND column_name = 'auth_user_id';

-- Se a coluna não existir, adicionar manualmente
-- ALTER TABLE public.members ADD COLUMN auth_user_id UUID REFERENCES auth.users(id); 