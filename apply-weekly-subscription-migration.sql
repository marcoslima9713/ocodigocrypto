-- Script para aplicar o sistema de assinatura semanal
-- Execute este script no Supabase SQL Editor

-- 1. Aplicar a migração principal
\i supabase/migrations/20250109000000_create_weekly_subscription_system.sql

-- 2. Atualizar usuários existentes para ter assinatura ativa por 7 dias
UPDATE public.members 
SET 
    subscription_start_date = now(),
    subscription_end_date = now() + INTERVAL '7 days',
    subscription_status = 'active',
    subscription_type = 'weekly',
    last_payment_date = now(),
    payment_count = 1
WHERE subscription_start_date IS NULL 
  AND is_active = true;

-- 3. Verificar se a migração foi aplicada corretamente
SELECT 
    id,
    email,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    subscription_type,
    payment_count
FROM public.members 
WHERE is_active = true
LIMIT 5;

-- 4. Testar a função de verificação de assinatura ativa
SELECT 
    email,
    subscription_status,
    subscription_end_date,
    public.is_subscription_active(id) as is_active,
    EXTRACT(DAYS FROM (subscription_end_date - now())) as days_remaining
FROM public.members 
WHERE is_active = true
LIMIT 5;

-- 5. Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_subscription_active',
    'user_has_active_subscription', 
    'create_weekly_subscription',
    'check_and_expire_subscriptions'
  );

-- 6. Testar a função de expiração (opcional - apenas para teste)
-- SELECT public.check_and_expire_subscriptions();

-- 7. Verificar tabela de pagamentos
SELECT COUNT(*) as total_payments FROM public.subscription_payments;

-- 8. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('subscription_payments', 'members')
ORDER BY tablename, policyname;
