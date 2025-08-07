-- Script para adicionar a coluna auth_user_id manualmente
-- Execute este script no SQL Editor do Supabase

-- Primeiro, verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'members' 
        AND table_schema = 'public'
        AND column_name = 'auth_user_id'
    ) THEN
        -- Adicionar a coluna se ela não existir
        ALTER TABLE public.members ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
        
        -- Adicionar índice para melhor performance
        CREATE INDEX idx_members_auth_user_id ON public.members(auth_user_id);
        
        -- Adicionar comentário
        COMMENT ON COLUMN public.members.auth_user_id IS 'Reference to Supabase auth.users table for authentication';
        
        RAISE NOTICE 'Coluna auth_user_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna auth_user_id já existe!';
    END IF;
END $$;

-- Verificar se foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' 
AND table_schema = 'public'
AND column_name = 'auth_user_id'; 