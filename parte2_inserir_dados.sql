-- PARTE 2: Inserir dados do usuário Marcos
-- Execute este script após o primeiro

-- Inserir usuário Marcos
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

-- Configurar privacidade
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

-- Limpar transações existentes
DELETE FROM public.transactions WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- Inserir transações de teste
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at) VALUES 
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.1, 45000.00, 4500.00, '2025-08-01 10:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.05, 44000.00, 2200.00, '2025-08-03 14:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.02, 46000.00, 920.00, '2025-08-05 09:15:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.03, 47000.00, 1410.00, '2025-08-06 16:45:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.01, 48000.00, 480.00, '2025-08-07 11:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 2.0, 3200.00, 6400.00, '2025-08-02 12:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 1.0, 3100.00, 3100.00, '2025-08-04 15:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 10.0, 120.00, 1200.00, '2025-08-03 16:00:00', NOW(), NOW());

-- Verificar se os dados foram inseridos
SELECT 'Dados do usuário inseridos com sucesso!' as status;
