-- Verificar se o usuário Marcos está configurado corretamente para o ranking
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe na tabela members
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at
FROM public.members 
WHERE email = 'marcoslima9713@gmail.com';

-- 2. Verificar se há transações para o usuário
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN transaction_type = 'buy' THEN total_usd ELSE 0 END) as total_invested,
    COUNT(DISTINCT crypto_symbol) as unique_cryptos
FROM public.transactions t
JOIN public.members m ON t.user_id::text = m.id::text
WHERE m.email = 'marcoslima9713@gmail.com';

-- 3. Verificar transações detalhadas
SELECT 
    t.crypto_symbol,
    t.transaction_type,
    t.amount,
    t.price_usd,
    t.total_usd,
    t.transaction_date,
    t.portfolio_id
FROM public.transactions t
JOIN public.members m ON t.user_id::text = m.id::text
WHERE m.email = 'marcoslima9713@gmail.com'
ORDER BY t.transaction_date DESC
LIMIT 10;

-- 4. Calcular resumo do portfólio atual
SELECT 
    t.crypto_symbol,
    SUM(CASE WHEN t.transaction_type = 'buy' THEN t.amount ELSE 0 END) as total_quantity,
    SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as total_invested,
    AVG(CASE WHEN t.transaction_type = 'buy' THEN t.price_usd ELSE NULL END) as avg_price,
    COUNT(CASE WHEN t.transaction_type = 'buy' THEN 1 END) as buy_count
FROM public.transactions t
JOIN public.members m ON t.user_id::text = m.id::text
WHERE m.email = 'marcoslima9713@gmail.com'
GROUP BY t.crypto_symbol
ORDER BY total_invested DESC;

-- 5. Verificar se o usuário está elegível para o ranking
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

-- 6. Verificar todos os membros ativos
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at
FROM public.members 
WHERE is_active = true
ORDER BY created_at DESC;

-- 7. Verificar se há problemas de tipo de dados
SELECT 
    'members.id' as column_name,
    data_type as members_id_type
FROM information_schema.columns 
WHERE table_name = 'members' AND column_name = 'id' AND table_schema = 'public'

UNION ALL

SELECT 
    'transactions.user_id' as column_name,
    data_type as transactions_user_id_type
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'user_id' AND table_schema = 'public';
