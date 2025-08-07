-- Script simplificado para testar o ranking
-- Usuário: Marcos Fut (856d169f-8563-4126-a348-fdedb4f3259f)

-- 1. Inserir usuário se não existir
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

-- 2. Configurar privacidade
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

-- 3. Limpar transações existentes do usuário (se houver)
DELETE FROM public.transactions WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 4. Inserir transações de teste
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
-- Bitcoin - várias compras para DCA
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.1, 45000.00, 4500.00, '2025-08-01 10:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.05, 44000.00, 2200.00, '2025-08-03 14:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.02, 46000.00, 920.00, '2025-08-05 09:15:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.03, 47000.00, 1410.00, '2025-08-06 16:45:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.01, 48000.00, 480.00, '2025-08-07 11:00:00', NOW(), NOW()),
-- Ethereum
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 2.0, 3200.00, 6400.00, '2025-08-02 12:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 1.0, 3100.00, 3100.00, '2025-08-04 15:30:00', NOW(), NOW()),
-- Solana
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 10.0, 120.00, 1200.00, '2025-08-03 16:00:00', NOW(), NOW());

-- 5. Verificar se as transações foram inseridas
SELECT 
    crypto_symbol,
    transaction_type,
    amount,
    price_usd,
    total_usd,
    transaction_date
FROM public.transactions 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f'
ORDER BY transaction_date;

-- 6. Verificar se o usuário está configurado corretamente
SELECT 
    u.id,
    u.display_name,
    u.username,
    u.created_at,
    ups.show_in_community_feed,
    ups.show_portfolio_stats
FROM public.users u
LEFT JOIN public.user_privacy_settings ups ON u.id = ups.user_id
WHERE u.id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 7. Tentar atualizar a materialized view
SELECT public.refresh_portfolio_rankings();

-- 8. Verificar se aparece no ranking
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
