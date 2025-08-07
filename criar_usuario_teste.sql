-- Criar usuário de teste no Supabase Auth
-- 
-- IMPORTANTE: Este comando deve ser executado no Supabase SQL Editor
-- Acesse: https://supabase.com/dashboard/project/wvojbjkdlnvlqgjwtdaf/sql/new
--
-- O usuário será criado com:
-- Email: marcoslima9713@gmail.com
-- Senha: 123456

-- Primeiro, verificar se o usuário já existe
SELECT id, email FROM auth.users WHERE email = 'marcoslima9713@gmail.com';

-- Se não existir, criar o usuário
-- NOTA: O Supabase não permite inserir diretamente na tabela auth.users
-- Use a API de Admin ou crie via dashboard

-- Alternativa: Criar usuário via função do Supabase
-- Esta é a forma recomendada de criar usuários programaticamente

-- Para criar um usuário manualmente:
-- 1. Acesse: https://supabase.com/dashboard/project/wvojbjkdlnvlqgjwtdaf/auth/users
-- 2. Clique em "Add user" -> "Create new user"
-- 3. Email: marcoslima9713@gmail.com
-- 4. Password: 123456
-- 5. Marque "Auto Confirm Email"

-- Após criar o usuário, você pode adicionar a role de admin:
-- (Execute este comando após criar o usuário pelo dashboard)
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
    id as user_id,
    'admin' as role,
    now() as created_at,
    now() as updated_at
FROM auth.users
WHERE email = 'marcoslima9713@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id
);