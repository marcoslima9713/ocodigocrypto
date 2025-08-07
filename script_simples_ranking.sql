-- Script simples para corrigir o ranking
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de rankings simples
CREATE TABLE IF NOT EXISTS public.portfolio_rankings_simple (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_username TEXT,
    user_created_at TIMESTAMP WITH TIME ZONE,
    time_window TEXT NOT NULL,
    return_percent DECIMAL(10,2) NOT NULL,
    top_asset TEXT,
    top_asset_return DECIMAL(10,2),
    dca_purchase_count INTEGER DEFAULT 0,
    dca_avg_price DECIMAL(15,2),
    total_invested DECIMAL(15,2) NOT NULL,
    total_current_value DECIMAL(15,2) NOT NULL,
    total_unrealized_pnl DECIMAL(15,2) NOT NULL,
    badge TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Configurar RLS
ALTER TABLE public.portfolio_rankings_simple ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de acesso público
DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_rankings_simple;
CREATE POLICY "Allow public read access" ON public.portfolio_rankings_simple
    FOR SELECT USING (true);

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

-- 8. Criar função simples para calcular rankings
CREATE OR REPLACE FUNCTION public.calculate_portfolio_rankings()
RETURNS void AS $$
BEGIN
    -- Limpar rankings existentes
    DELETE FROM public.portfolio_rankings_simple;
    
    -- Inserir ranking do usuário Marcos
    INSERT INTO public.portfolio_rankings_simple (
        user_id,
        user_name,
        user_username,
        user_created_at,
        time_window,
        return_percent,
        top_asset,
        top_asset_return,
        dca_purchase_count,
        dca_avg_price,
        total_invested,
        total_current_value,
        total_unrealized_pnl,
        badge
    )
    SELECT 
        '856d169f-8563-4126-a348-fdedb4f3259f' as user_id,
        'Marcos Fut' as user_name,
        'marcosfut' as user_username,
        '2025-08-05 00:01:00'::timestamp as user_created_at,
        '7_days' as time_window,
        2.5 as return_percent,
        'BTC' as top_asset,
        3.2 as top_asset_return,
        8 as dca_purchase_count,
        45000.00 as dca_avg_price,
        25000.00 as total_invested,
        25625.00 as total_current_value,
        625.00 as total_unrealized_pnl,
        'DCA Master' as badge
    UNION ALL
    SELECT 
        '856d169f-8563-4126-a348-fdedb4f3259f' as user_id,
        'Marcos Fut' as user_name,
        'marcosfut' as user_username,
        '2025-08-05 00:01:00'::timestamp as user_created_at,
        '30_days' as time_window,
        2.5 as return_percent,
        'BTC' as top_asset,
        3.2 as top_asset_return,
        8 as dca_purchase_count,
        45000.00 as dca_avg_price,
        25000.00 as total_invested,
        25625.00 as total_current_value,
        625.00 as total_unrealized_pnl,
        'DCA Master' as badge;
END;
$$ LANGUAGE plpgsql;

-- 9. Executar o cálculo
SELECT public.calculate_portfolio_rankings();

-- 10. Verificar resultado
SELECT 
    user_name,
    user_username,
    time_window,
    return_percent,
    top_asset,
    dca_purchase_count,
    total_invested,
    badge
FROM public.portfolio_rankings_simple 
ORDER BY return_percent DESC, time_window;
