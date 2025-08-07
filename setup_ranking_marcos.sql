-- Script completo para configurar o ranking do usuário Marcos
-- Execute este script no Supabase SQL Editor

-- 1. Inserir usuário Marcos
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

-- 2. Configurar privacidade para aparecer no feed
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

-- 3. Limpar transações existentes do usuário
DELETE FROM public.transactions WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 4. Inserir transações de teste (DCA - Dollar Cost Averaging)
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
-- Bitcoin - Estratégia DCA (várias compras pequenas)
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.1, 45000.00, 4500.00, '2025-08-01 10:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.05, 44000.00, 2200.00, '2025-08-03 14:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.02, 46000.00, 920.00, '2025-08-05 09:15:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.03, 47000.00, 1410.00, '2025-08-06 16:45:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.01, 48000.00, 480.00, '2025-08-07 11:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.02, 47500.00, 950.00, '2025-08-08 15:20:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.015, 47000.00, 705.00, '2025-08-09 12:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.025, 46500.00, 1162.50, '2025-08-10 09:45:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.03, 46000.00, 1380.00, '2025-08-11 16:15:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'BTC', 'buy', 0.02, 45500.00, 910.00, '2025-08-12 11:00:00', NOW(), NOW()),
-- Ethereum
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 2.0, 3200.00, 6400.00, '2025-08-02 12:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 1.0, 3100.00, 3100.00, '2025-08-04 15:30:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'ETH', 'buy', 1.5, 3150.00, 4725.00, '2025-08-06 14:20:00', NOW(), NOW()),
-- Solana
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 10.0, 120.00, 1200.00, '2025-08-03 16:00:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 5.0, 115.00, 575.00, '2025-08-07 13:45:00', NOW(), NOW()),
(gen_random_uuid(), '856d169f-8563-4126-a348-fdedb4f3259f', 'SOL', 'buy', 8.0, 118.00, 944.00, '2025-08-09 10:30:00', NOW(), NOW());

-- 5. Criar tabela simples de rankings se não existir
CREATE TABLE IF NOT EXISTS public.portfolio_rankings_simple (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_username TEXT,
    user_created_at TIMESTAMP WITH TIME ZONE,
    time_window TEXT NOT NULL CHECK (time_window IN ('7_days', '30_days')),
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

-- 6. Criar função para calcular rankings se não existir
CREATE OR REPLACE FUNCTION public.calculate_portfolio_rankings()
RETURNS void AS $$
BEGIN
    -- Limpar rankings existentes
    DELETE FROM public.portfolio_rankings_simple;
    
    -- Inserir rankings calculados
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
    WITH portfolio_summary AS (
        SELECT 
            t.user_id,
            t.crypto_symbol,
            SUM(CASE WHEN t.transaction_type = 'buy' THEN t.amount ELSE 0 END) as total_quantity,
            SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as invested_amount,
            AVG(CASE WHEN t.transaction_type = 'buy' THEN t.price_usd END) as avg_buy_price,
            COUNT(CASE WHEN t.transaction_type = 'buy' THEN 1 END) as buy_count
        FROM public.transactions t
        WHERE t.transaction_type = 'buy'
        GROUP BY t.user_id, t.crypto_symbol
    ),
    current_prices AS (
        -- Preços atuais simulados
        SELECT 'BTC' as crypto_symbol, 45000.00 as current_price
        UNION ALL SELECT 'ETH', 3200.00
        UNION ALL SELECT 'ADA', 0.50
        UNION ALL SELECT 'SOL', 120.00
        UNION ALL SELECT 'DOT', 8.50
        UNION ALL SELECT 'LINK', 16.00
        UNION ALL SELECT 'MATIC', 0.90
        UNION ALL SELECT 'AVAX', 38.00
    ),
    portfolio_values AS (
        SELECT 
            ps.user_id,
            ps.crypto_symbol,
            ps.total_quantity,
            ps.invested_amount,
            ps.avg_buy_price,
            ps.buy_count,
            cp.current_price,
            (ps.total_quantity * cp.current_price) as current_value,
            ((ps.total_quantity * cp.current_price) - ps.invested_amount) as unrealized_pnl,
            CASE 
                WHEN ps.invested_amount > 0 THEN 
                    (((ps.total_quantity * cp.current_price) - ps.invested_amount) / ps.invested_amount * 100)
                ELSE 0 
            END as return_percent
        FROM portfolio_summary ps
        JOIN current_prices cp ON ps.crypto_symbol = cp.crypto_symbol
        WHERE ps.invested_amount > 100
    ),
    user_totals AS (
        SELECT 
            pv.user_id,
            SUM(pv.invested_amount) as total_invested,
            SUM(pv.current_value) as total_current_value,
            SUM(pv.unrealized_pnl) as total_unrealized_pnl,
            CASE 
                WHEN SUM(pv.invested_amount) > 0 THEN 
                    (SUM(pv.unrealized_pnl) / SUM(pv.invested_amount) * 100)
                ELSE 0 
            END as total_return_percent,
            SUM(pv.buy_count) as total_buy_count,
            AVG(pv.avg_buy_price) as overall_avg_price,
            MAX(pv.return_percent) as best_asset_return,
            MAX(CASE WHEN pv.return_percent = MAX(pv.return_percent) THEN pv.crypto_symbol END) as best_asset
        FROM portfolio_values pv
        GROUP BY pv.user_id
    )
    SELECT 
        ut.user_id,
        COALESCE(u.display_name, 'Usuário Anônimo') as user_name,
        COALESCE(u.username, '') as user_username,
        u.created_at as user_created_at,
        '7_days' as time_window,
        ut.total_return_percent as return_percent,
        ut.best_asset as top_asset,
        ut.best_asset_return as top_asset_return,
        ut.total_buy_count as dca_purchase_count,
        ut.overall_avg_price as dca_avg_price,
        ut.total_invested,
        ut.total_current_value,
        ut.total_unrealized_pnl,
        CASE 
            WHEN ut.total_return_percent >= 50 THEN 'Top Trader'
            WHEN ut.total_return_percent >= 25 THEN 'Elite Trader'
            WHEN ut.total_buy_count >= 10 THEN 'DCA Master'
            ELSE NULL
        END as badge
    FROM user_totals ut
    JOIN public.users u ON ut.user_id = u.id
    WHERE 
        u.created_at < NOW() - INTERVAL '7 days'
        AND ut.total_invested > 100
        AND EXISTS (
            SELECT 1 FROM public.user_privacy_settings ups 
            WHERE ups.user_id = u.id AND ups.show_in_community_feed = true
        )
    UNION ALL
    SELECT 
        ut.user_id,
        COALESCE(u.display_name, 'Usuário Anônimo') as user_name,
        COALESCE(u.username, '') as user_username,
        u.created_at as user_created_at,
        '30_days' as time_window,
        ut.total_return_percent as return_percent,
        ut.best_asset as top_asset,
        ut.best_asset_return as top_asset_return,
        ut.total_buy_count as dca_purchase_count,
        ut.overall_avg_price as dca_avg_price,
        ut.total_invested,
        ut.total_current_value,
        ut.total_unrealized_pnl,
        CASE 
            WHEN ut.total_return_percent >= 50 THEN 'Top Trader'
            WHEN ut.total_return_percent >= 25 THEN 'Elite Trader'
            WHEN ut.total_buy_count >= 10 THEN 'DCA Master'
            ELSE NULL
        END as badge
    FROM user_totals ut
    JOIN public.users u ON ut.user_id = u.id
    WHERE 
        u.created_at < NOW() - INTERVAL '7 days'
        AND ut.total_invested > 100
        AND EXISTS (
            SELECT 1 FROM public.user_privacy_settings ups 
            WHERE ups.user_id = u.id AND ups.show_in_community_feed = true
        );
END;
$$ LANGUAGE plpgsql;

-- 7. Executar o cálculo dos rankings
SELECT public.calculate_portfolio_rankings();

-- 8. Verificar se o usuário Marcos aparece no ranking
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
FROM public.portfolio_rankings_simple 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f'
ORDER BY time_window;

-- 9. Mostrar todos os rankings ordenados por retorno
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
