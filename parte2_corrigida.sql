-- PARTE 2 CORRIGIDA: Criar tabelas e inserir dados do usuário Marcos
-- Execute este script após o primeiro

-- 1. Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela user_privacy_settings se não existir
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id),
    show_in_community_feed BOOLEAN DEFAULT false,
    show_portfolio_stats BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela transactions se não existir
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    crypto_symbol TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
    amount DECIMAL(15,8) NOT NULL,
    price_usd DECIMAL(15,2) NOT NULL,
    total_usd DECIMAL(15,2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir usuário Marcos
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

-- 5. Configurar privacidade
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

-- 6. Limpar transações existentes
DELETE FROM public.transactions WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 7. Inserir transações de teste
INSERT INTO public.transactions (id, user_id, crypto_symbol, transaction_type, amount, price_usd, total_usd, transaction_date, created_at, updated_at) VALUES 
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.1, 45000.00, 4500.00, '2025-08-01 10:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.05, 44000.00, 2200.00, '2025-08-03 14:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.02, 46000.00, 920.00, '2025-08-05 09:15:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.03, 47000.00, 1410.00, '2025-08-06 16:45:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.01, 48000.00, 480.00, '2025-08-07 11:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 2.0, 3200.00, 6400.00, '2025-08-02 12:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 1.0, 3100.00, 3100.00, '2025-08-04 15:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 10.0, 120.00, 1200.00, '2025-08-03 16:00:00', NOW(), NOW());

-- 8. Verificar se os dados foram inseridos
SELECT 'Dados do usuário inseridos com sucesso!' as status;

-- 9. Verificar se o usuário foi criado
SELECT 
    id,
    display_name,
    username,
    email
FROM public.users 
WHERE id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 10. Verificar transações
SELECT 
    COUNT(*) as total_transações,
    SUM(total_usd) as total_investido
FROM public.transactions 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';
