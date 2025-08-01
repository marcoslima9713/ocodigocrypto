-- Script para configurar um usuário admin
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos verificar se há usuários na tabela members
SELECT 
  id,
  email,
  full_name,
  created_at
FROM public.members 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Para criar um admin, você precisa do Firebase UID do usuário
-- Você pode encontrar isso no console do Firebase ou no browser quando logado
-- Substitua 'FIREBASE_UID_AQUI' pelo UID real do usuário

-- Exemplo de como inserir um admin:
-- INSERT INTO public.user_roles (firebase_uid, role) 
-- VALUES ('FIREBASE_UID_AQUI', 'admin')
-- ON CONFLICT (firebase_uid, role) DO NOTHING;

-- 3. Para verificar se o usuário foi criado como admin:
-- SELECT 
--   ur.firebase_uid,
--   ur.role,
--   m.email,
--   m.full_name
-- FROM public.user_roles ur
-- LEFT JOIN public.members m ON m.id = ur.firebase_uid
-- WHERE ur.role = 'admin';

-- 4. Para listar todos os usuários e seus papéis:
-- SELECT 
--   ur.firebase_uid,
--   ur.role,
--   m.email,
--   m.full_name,
--   ur.created_at
-- FROM public.user_roles ur
-- LEFT JOIN public.members m ON m.id = ur.firebase_uid
-- ORDER BY ur.created_at DESC; 