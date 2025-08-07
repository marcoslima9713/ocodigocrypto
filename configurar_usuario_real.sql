-- Configurar usuário Marcos Fut com dados reais de portfólio
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe na tabela de autenticação
SELECT id, email, raw_user_meta_data, created_at 
FROM auth.users 
WHERE id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 2. Configurar privacidade para aparecer no ranking
INSERT INTO public.user_privacy_settings (user_id, show_in_community_feed, show_portfolio_value, show_transactions) 
VALUES ('856d169f-8563-4126-a348-fdedb4f3259f', true, true, true)
ON CONFLICT (user_id) DO UPDATE SET
  show_in_community_feed = true,
  show_portfolio_value = true,
  show_transactions = true;

-- 3. Limpar transações existentes do Marcos
DELETE FROM public.transactions 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 4. Inserir transações reais de portfólio (dados simulados baseados em valores reais)
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at) VALUES
-- Compra de Bitcoin
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.1, 45000, 4500, NOW() - INTERVAL '30 days', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.05, 44000, 2200, NOW() - INTERVAL '25 days', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.08, 46000, 3680, NOW() - INTERVAL '20 days', NOW(), NOW()),

-- Compra de Ethereum
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 1.5, 3000, 4500, NOW() - INTERVAL '28 days', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 0.8, 3100, 2480, NOW() - INTERVAL '22 days', NOW(), NOW()),

-- Compra de Solana
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 25, 100, 2500, NOW() - INTERVAL '26 days', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 15, 110, 1650, NOW() - INTERVAL '18 days', NOW(), NOW()),

-- Compra de Cardano
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ADA', 'buy', 2000, 0.5, 1000, NOW() - INTERVAL '24 days', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ADA', 'buy', 1500, 0.48, 720, NOW() - INTERVAL '15 days', NOW(), NOW()),

-- Compra de Polkadot
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'DOT', 'buy', 100, 8, 800, NOW() - INTERVAL '21 days', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'DOT', 'buy', 50, 8.5, 425, NOW() - INTERVAL '12 days', NOW(), NOW());

-- 5. Verificar as transações inseridas
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

-- 6. Calcular resumo do portfólio
SELECT 
    crypto_symbol,
    SUM(CASE WHEN transaction_type = 'buy' THEN amount ELSE 0 END) as total_quantity,
    SUM(CASE WHEN transaction_type = 'buy' THEN total_usd ELSE 0 END) as total_invested,
    AVG(CASE WHEN transaction_type = 'buy' THEN price_usd ELSE NULL END) as avg_price,
    COUNT(CASE WHEN transaction_type = 'buy' THEN 1 END) as buy_count
FROM public.transactions 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f'
GROUP BY crypto_symbol
ORDER BY total_invested DESC;

-- 7. Verificar configuração de privacidade
SELECT 
    user_id,
    show_in_community_feed,
    show_portfolio_value,
    show_transactions
FROM public.user_privacy_settings 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 8. Verificar se o usuário está elegível para o ranking
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'display_name' as display_name,
    u.created_at,
    ups.show_in_community_feed,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as total_invested
FROM auth.users u
LEFT JOIN public.user_privacy_settings ups ON u.id = ups.user_id
LEFT JOIN public.transactions t ON u.id = t.user_id
WHERE u.id = '856d169f-8563-4126-a348-fdedb4f3259f'
GROUP BY u.id, u.email, u.raw_user_meta_data, u.created_at, ups.show_in_community_feed;
