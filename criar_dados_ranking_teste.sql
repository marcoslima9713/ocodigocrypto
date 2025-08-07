-- Script para criar dados de teste para o ranking
-- Usuário: Marcos Fut (856d169f-8563-4126-a348-fdedb4f3259f)

-- 1. Verificar se o usuário existe na tabela users
INSERT INTO public.users (id, email, display_name, username, created_at, updated_at)
VALUES (
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'marcoslima9713@gmail.com',
    'Marcos Fut',
    'marcosfut',
    '2025-08-05 00:01:00',
    '2025-08-07 11:26:00'
)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = EXCLUDED.username,
    updated_at = EXCLUDED.updated_at;

-- 2. Configurar privacidade para aparecer no feed da comunidade
INSERT INTO public.user_privacy_settings (user_id, show_in_community_feed, show_portfolio_stats, created_at, updated_at)
VALUES (
    '856d169f-8563-4126-a348-fdedb4f3259f',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    show_in_community_feed = true,
    show_portfolio_stats = true,
    updated_at = NOW();

-- 3. Inserir transações de teste (compras de Bitcoin)
INSERT INTO public.transactions (
    id,
    user_id,
    crypto_symbol,
    transaction_type,
    amount,
    price_usd,
    total_usd,
    transaction_date,
    created_at,
    updated_at
) VALUES 
-- Compra 1: 0.1 BTC a $45,000
(
    gen_random_uuid(),
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'BTC',
    'buy',
    0.1,
    45000.00,
    4500.00,
    '2025-08-01 10:00:00',
    NOW(),
    NOW()
),
-- Compra 2: 0.05 BTC a $44,000
(
    gen_random_uuid(),
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'BTC',
    'buy',
    0.05,
    44000.00,
    2200.00,
    '2025-08-03 14:30:00',
    NOW(),
    NOW()
),
-- Compra 3: 0.02 BTC a $46,000
(
    gen_random_uuid(),
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'BTC',
    'buy',
    0.02,
    46000.00,
    920.00,
    '2025-08-05 09:15:00',
    NOW(),
    NOW()
),
-- Compra 4: 0.03 BTC a $47,000
(
    gen_random_uuid(),
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'BTC',
    'buy',
    0.03,
    47000.00,
    1410.00,
    '2025-08-06 16:45:00',
    NOW(),
    NOW()
),
-- Compra 5: 0.01 BTC a $48,000
(
    gen_random_uuid(),
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'BTC',
    'buy',
    0.01,
    48000.00,
    480.00,
    '2025-08-07 11:00:00',
    NOW(),
    NOW()
);

-- 4. Inserir algumas transações de Ethereum também
INSERT INTO public.transactions (
    id,
    user_id,
    crypto_symbol,
    transaction_type,
    amount,
    price_usd,
    total_usd,
    transaction_date,
    created_at,
    updated_at
) VALUES 
-- Compra 1: 2 ETH a $3,200
(
    gen_random_uuid(),
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'ETH',
    'buy',
    2.0,
    3200.00,
    6400.00,
    '2025-08-02 12:00:00',
    NOW(),
    NOW()
),
-- Compra 2: 1 ETH a $3,100
(
    gen_random_uuid(),
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'ETH',
    'buy',
    1.0,
    3100.00,
    3100.00,
    '2025-08-04 15:30:00',
    NOW(),
    NOW()
);

-- 5. Atualizar a materialized view de rankings
SELECT public.refresh_portfolio_rankings();

-- 6. Verificar se os dados foram inseridos corretamente
SELECT 
    user_id,
    user_name,
    user_username,
    time_window,
    return_percent,
    top_asset,
    top_asset_return,
    dca_purchase_count,
    total_invested,
    total_current_value,
    badge
FROM public.portfolio_performance_rankings 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f'
ORDER BY time_window;
