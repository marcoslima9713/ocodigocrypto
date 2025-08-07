-- Corrigir usuário Marcos na tabela members
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela members existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'members'
) as table_exists;

-- 2. Verificar estrutura da tabela members
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se o usuário Marcos existe na tabela members
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at,
    updated_at
FROM public.members 
WHERE email = 'marcoslima9713@gmail.com';

-- 4. Se não existir, criar o usuário Marcos
INSERT INTO public.members (id, email, full_name, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'marcoslima9713@gmail.com',
    'Marcos Fut',
    true,
    NOW() - INTERVAL '2 hours', -- Criado há 2 horas para garantir elegibilidade
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.members WHERE email = 'marcoslima9713@gmail.com'
);

-- 5. Garantir que o usuário Marcos esteja ativo
UPDATE public.members 
SET 
    is_active = true,
    updated_at = NOW()
WHERE email = 'marcoslima9713@gmail.com';

-- 6. Verificar todos os membros
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at,
    updated_at
FROM public.members 
ORDER BY created_at DESC;

-- 7. Verificar membros ativos criados nas últimas 24 horas
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at,
    updated_at
FROM public.members 
WHERE is_active = true 
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 8. Verificar se há transações para o usuário Marcos
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN transaction_type = 'buy' THEN total_usd ELSE 0 END) as total_invested,
    COUNT(DISTINCT crypto_symbol) as unique_cryptos
FROM public.transactions t
JOIN public.members m ON t.user_id::text = m.id::text
WHERE m.email = 'marcoslima9713@gmail.com';

-- 9. Se não há transações, inserir transações baseadas nos dados reais
INSERT INTO public.transactions (id, user_id, portfolio_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    m.id::uuid,
    'main',
    'BTC',
    'buy',
    1.0,
    114700.00,
    114700.00,
    NOW() - INTERVAL '30 days',
    NOW(),
    NOW()
FROM public.members m 
WHERE m.email = 'marcoslima9713@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.user_id::text = m.id::text 
    AND t.crypto_symbol = 'BTC'
);

-- 10. Inserir transação ETH
INSERT INTO public.transactions (id, user_id, portfolio_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    m.id::uuid,
    'main',
    'ETH',
    'buy',
    1.0,
    3672.34,
    3672.34,
    NOW() - INTERVAL '25 days',
    NOW(),
    NOW()
FROM public.members m 
WHERE m.email = 'marcoslima9713@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.user_id::text = m.id::text 
    AND t.crypto_symbol = 'ETH'
);

-- 11. Inserir transação ADA
INSERT INTO public.transactions (id, user_id, portfolio_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    m.id::uuid,
    'main',
    'ADA',
    'buy',
    100.0,
    0.75,
    75.02,
    NOW() - INTERVAL '20 days',
    NOW(),
    NOW()
FROM public.members m 
WHERE m.email = 'marcoslima9713@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.user_id::text = m.id::text 
    AND t.crypto_symbol = 'ADA'
);

-- 12. Verificar status final
SELECT 
    m.full_name as user_name,
    m.email,
    m.is_active,
    m.created_at,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as total_invested,
    CASE 
        WHEN SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) >= 100 
        THEN '✅ Elegível para ranking' 
        ELSE '❌ Não elegível (investimento < $100)' 
    END as status
FROM public.members m
LEFT JOIN public.transactions t ON m.id::text = t.user_id::text
WHERE m.email = 'marcoslima9713@gmail.com'
GROUP BY m.id, m.full_name, m.email, m.is_active, m.created_at;
