-- Script de Debug para verificar por que o usuário não aparece no ranking
-- Email: marcoslima9713@gmail.com

-- 1. Verificar se o usuário existe em auth.users
SELECT 
    '1. Verificação em auth.users' as etapa,
    id,
    email,
    created_at,
    NOW() - created_at as tempo_conta
FROM auth.users 
WHERE email = 'marcoslima9713@gmail.com';

-- 2. Verificar se o usuário existe em members
SELECT 
    '2. Verificação em members' as etapa,
    id,
    email,
    full_name,
    is_active,
    created_at
FROM public.members 
WHERE email = 'marcoslima9713@gmail.com';

-- 3. Verificar se a tabela user_privacy_settings existe
SELECT 
    '3. Verificação da tabela privacy' as etapa,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_privacy_settings' 
            AND table_schema = 'public'
        ) THEN '✅ TABELA EXISTE'
        ELSE '❌ TABELA NÃO EXISTE'
    END as status;

-- 4. Verificar transações do usuário
SELECT 
    '4. Verificação de transações' as etapa,
    COUNT(*) as total_transacoes,
    SUM(CASE WHEN transaction_type = 'buy' THEN total_usd ELSE 0 END) as total_investido,
    SUM(CASE WHEN transaction_type = 'sell' THEN total_usd ELSE 0 END) as total_vendido
FROM public.transactions 
WHERE user_id IN (
    SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
);

-- 5. Verificar detalhes das transações
SELECT 
    '5. Detalhes das transações' as etapa,
    transaction_type,
    crypto_symbol,
    amount,
    total_usd,
    transaction_date
FROM public.transactions 
WHERE user_id IN (
    SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
)
ORDER BY transaction_date;

-- 6. Verificar preços das criptomoedas
SELECT 
    '6. Verificação de preços' as etapa,
    crypto_symbol,
    price_usd,
    updated_at
FROM public.crypto_prices 
WHERE crypto_symbol IN ('BTC', 'ETH', 'ADA');

-- 7. Simular cálculo do ranking para o usuário
WITH user_transactions AS (
    SELECT 
        user_id,
        crypto_symbol,
        SUM(CASE WHEN transaction_type = 'buy' THEN amount ELSE 0 END) as qty_buy,
        SUM(CASE WHEN transaction_type = 'buy' THEN total_usd ELSE 0 END) as invested_usd,
        SUM(CASE WHEN transaction_type = 'sell' THEN amount ELSE 0 END) as qty_sell,
        SUM(CASE WHEN transaction_type = 'sell' THEN total_usd ELSE 0 END) as redeemed_usd
    FROM public.transactions 
    WHERE user_id IN (
        SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
    )
    GROUP BY user_id, crypto_symbol
),
user_positions AS (
    SELECT 
        user_id,
        crypto_symbol,
        (qty_buy - COALESCE(qty_sell, 0)) as net_quantity,
        (invested_usd - COALESCE(redeemed_usd, 0)) as net_invested
    FROM user_transactions
    WHERE (qty_buy - COALESCE(qty_sell, 0)) > 0
),
user_portfolio AS (
    SELECT 
        user_id,
        SUM(net_invested) as total_invested,
        SUM(net_quantity * cp.price_usd) as total_current_value
    FROM user_positions up
    JOIN public.crypto_prices cp ON up.crypto_symbol = cp.crypto_symbol
    GROUP BY user_id
)
SELECT 
    '7. Cálculo simulado do ranking' as etapa,
    total_invested,
    total_current_value,
    (total_current_value - total_invested) as profit_usd,
    ((total_current_value - total_invested) / total_invested * 100) as return_percent,
    CASE 
        WHEN total_current_value > total_invested THEN 'LUCRO'
        ELSE 'PREJUÍZO'
    END as status
FROM user_portfolio;

-- 8. Verificar se o usuário atende todos os critérios
SELECT 
    '8. Verificação de critérios' as etapa,
    'Conta ativa há 1+ hora' as criterio,
    CASE 
        WHEN u.created_at < NOW() - INTERVAL '1 hour' THEN '✅ ATENDE'
        ELSE '❌ NÃO ATENDE'
    END as status
FROM auth.users u
WHERE u.email = 'marcoslima9713@gmail.com'

UNION ALL

SELECT 
    '8. Verificação de critérios' as etapa,
    'Investimento mínimo $100' as criterio,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.user_id = u.id::text
            AND t.transaction_type = 'buy'
            GROUP BY t.user_id
            HAVING SUM(t.total_usd) >= 100
        ) THEN '✅ ATENDE'
        ELSE '❌ NÃO ATENDE'
    END as status
FROM auth.users u
WHERE u.email = 'marcoslima9713@gmail.com'

UNION ALL

SELECT 
    '8. Verificação de critérios' as etapa,
    'Tem transações registradas' as criterio,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.user_id = u.id::text
        ) THEN '✅ ATENDE'
        ELSE '❌ NÃO ATENDE'
    END as status
FROM auth.users u
WHERE u.email = 'marcoslima9713@gmail.com'

UNION ALL

SELECT 
    '8. Verificação de critérios' as etapa,
    'Está com lucro' as criterio,
    CASE 
        WHEN EXISTS (
            WITH user_portfolio AS (
                SELECT 
                    t.user_id,
                    SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as invested,
                    SUM(CASE WHEN t.transaction_type = 'sell' THEN t.total_usd ELSE 0 END) as redeemed
                FROM public.transactions t
                WHERE t.user_id = u.id::text
                GROUP BY t.user_id
            )
            SELECT 1 FROM user_portfolio
            WHERE (invested - COALESCE(redeemed, 0)) > 0
        ) THEN '✅ ATENDE'
        ELSE '❌ NÃO ATENDE'
    END as status
FROM auth.users u
WHERE u.email = 'marcoslima9713@gmail.com';

-- 9. Verificar ranking atual
SELECT 
    '9. Ranking atual' as etapa,
    COUNT(*) as total_usuarios_no_ranking
FROM public.portfolio_performance_rankings_v2;

-- 10. Forçar refresh do ranking
SELECT 
    '10. Forçando refresh' as etapa,
    public.refresh_portfolio_rankings_v2() as resultado;
