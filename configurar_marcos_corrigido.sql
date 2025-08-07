-- Configurar usuário Marcos Fut para aparecer no ranking
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário Marcos Fut existe na tabela members
SELECT id, email, full_name, is_active, created_at 
FROM public.members 
WHERE email = 'marcoslima9713@gmail.com';

-- 2. Atualizar o usuário Marcos Fut para estar ativo
UPDATE public.members 
SET is_active = true
WHERE email = 'marcoslima9713@gmail.com';

-- 3. Verificar a estrutura das tabelas para entender os tipos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Limpar transações existentes do Marcos (com cast explícito)
DELETE FROM public.transactions 
WHERE user_id::text = (SELECT id::text FROM public.members WHERE email = 'marcoslima9713@gmail.com');

-- 5. Inserir transações uma por uma com cast explícito
-- Transação 1: BTC
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'BTC', 'buy', 0.1, 45000, 4500, NOW() - INTERVAL '30 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 2: BTC
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'BTC', 'buy', 0.05, 44000, 2200, NOW() - INTERVAL '25 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 3: BTC
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'BTC', 'buy', 0.08, 46000, 3680, NOW() - INTERVAL '20 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 4: ETH
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'ETH', 'buy', 1.5, 3000, 4500, NOW() - INTERVAL '28 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 5: ETH
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'ETH', 'buy', 0.8, 3100, 2480, NOW() - INTERVAL '22 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 6: SOL
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'SOL', 'buy', 25, 100, 2500, NOW() - INTERVAL '26 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 7: SOL
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'SOL', 'buy', 15, 110, 1650, NOW() - INTERVAL '18 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 8: ADA
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'ADA', 'buy', 2000, 0.5, 1000, NOW() - INTERVAL '24 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 9: ADA
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'ADA', 'buy', 1500, 0.48, 720, NOW() - INTERVAL '15 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 10: DOT
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'DOT', 'buy', 100, 8, 800, NOW() - INTERVAL '21 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- Transação 11: DOT
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at)
SELECT gen_random_uuid(), id::uuid, 'DOT', 'buy', 50, 8.5, 425, NOW() - INTERVAL '12 days', NOW(), NOW()
FROM public.members WHERE email = 'marcoslima9713@gmail.com';

-- 6. Verificar as transações inseridas
SELECT 
    t.crypto_symbol,
    t.transaction_type,
    t.amount,
    t.price_usd,
    t.total_usd,
    t.transaction_date,
    m.full_name as user_name
FROM public.transactions t
JOIN public.members m ON t.user_id::text = m.id::text
WHERE m.email = 'marcoslima9713@gmail.com'
ORDER BY t.transaction_date;

-- 7. Calcular resumo do portfólio
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

-- 8. Verificar se o usuário está elegível para o ranking
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

-- 9. Listar todos os membros ativos
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at
FROM public.members 
WHERE is_active = true
ORDER BY created_at DESC;
