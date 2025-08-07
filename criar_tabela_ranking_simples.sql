-- Criar tabela simples para rankings (alternativa à materialized view)
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

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_portfolio_rankings_simple_user_id ON public.portfolio_rankings_simple (user_id, time_window);
CREATE INDEX IF NOT EXISTS idx_portfolio_rankings_simple_return_percent ON public.portfolio_rankings_simple (return_percent DESC, time_window);
CREATE INDEX IF NOT EXISTS idx_portfolio_rankings_simple_top_asset ON public.portfolio_rankings_simple (top_asset_return DESC, time_window);
CREATE INDEX IF NOT EXISTS idx_portfolio_rankings_simple_dca ON public.portfolio_rankings_simple (dca_purchase_count DESC, time_window);

-- Função para calcular e inserir rankings
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

-- Executar o cálculo inicial
SELECT public.calculate_portfolio_rankings();

-- Verificar se funcionou
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
ORDER BY return_percent DESC, time_window;
