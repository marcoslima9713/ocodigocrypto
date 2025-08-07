-- Script para criar usuário de teste na autenticação do Supabase
-- Este script deve ser executado no painel do Supabase

-- 1. Primeiro, vamos verificar se o usuário já existe na tabela members
SELECT id, email, full_name, is_active, created_at 
FROM public.members 
WHERE email = 'tradermmtradingcenter@gmail.com';

-- 2. Se o usuário existe na tabela members, vamos criar na autenticação
-- NOTA: O Supabase não permite inserir diretamente na tabela auth.users
-- Você precisa usar a API do Supabase ou o painel administrativo

-- 3. Para criar o usuário via API, use o seguinte comando curl:
/*
curl -X POST 'https://wvojbjkdlnvlqgjwtdaf.supabase.co/auth/v1/admin/users' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2b2piamtkbG52bHFnanF3dGRhZiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzU3Mjk3MTksImV4cCI6MjA1MTMwNTcxOX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2b2biamtkbG52bHFnanF3dGRhZiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzU3Mjk3MTksImV4cCI6MjA1MTMwNTcxOX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tradermmtradingcenter@gmail.com",
    "password": "ZxIyaAE4AdXm",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "marcos paulo",
      "product_name": "Product_ADGtUojEAsnGUmOruCy8"
    }
  }'
*/

-- 4. Alternativamente, você pode criar o usuário manualmente no painel do Supabase:
-- Acesse: https://supabase.com/dashboard/project/wvojbjkdlnvlqgjwtdaf/auth/users
-- Clique em "Add User" e preencha:
-- Email: tradermmtradingcenter@gmail.com
-- Password: ZxIyaAE4AdXm
-- Marque "Email confirmed"

-- 5. Depois de criar o usuário na autenticação, atualize a tabela members:
UPDATE public.members 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'tradermmtradingcenter@gmail.com'
)
WHERE email = 'tradermmtradingcenter@gmail.com';

-- 6. Verifique se a atualização foi bem-sucedida:
SELECT 
  m.id,
  m.email,
  m.full_name,
  m.auth_user_id,
  au.id as auth_user_id_from_auth,
  au.email as auth_email
FROM public.members m
LEFT JOIN auth.users au ON au.id = m.auth_user_id
WHERE m.email = 'tradermmtradingcenter@gmail.com'; 