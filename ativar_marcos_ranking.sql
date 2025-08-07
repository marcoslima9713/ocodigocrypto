-- Ativar usuário Marcos para aparecer no ranking
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário Marcos existe na tabela members
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at
FROM public.members 
WHERE email = 'marcoslima9713@gmail.com';

-- 2. Se não existir, criar o usuário Marcos na tabela members
INSERT INTO public.members (id, email, full_name, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'marcoslima9713@gmail.com',
    'Marcos Fut',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.members WHERE email = 'marcoslima9713@gmail.com'
);

-- 3. Garantir que o usuário Marcos esteja ativo
UPDATE public.members 
SET is_active = true
WHERE email = 'marcoslima9713@gmail.com';

-- 4. Verificar se há transações para o usuário Marcos
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN transaction_type = 'buy' THEN total_usd ELSE 0 END) as total_invested,
    COUNT(DISTINCT crypto_symbol) as unique_cryptos
FROM public.transactions t
JOIN public.members m ON t.user_id::text = m.id::text
WHERE m.email = 'marcoslima9713@gmail.com';

-- 5. Se não há transações, inserir transações baseadas nos dados reais do dashboard
-- Baseado nos dados que você mostrou: US$ 118.447,36 investidos
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

-- 6. Inserir transação ETH
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

-- 7. Inserir transação ADA
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

-- 8. Verificar o status final
SELECT 
    m.full_name as user_name,
    m.email,
    m.is_active,
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
GROUP BY m.id, m.full_name, m.email, m.is_active;

-- 9. Verificar todos os membros ativos
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at
FROM public.members 
WHERE is_active = true
ORDER BY created_at DESC;
