-- Criação da materialized view para rankings de performance de portfólio
CREATE MATERIALIZED VIEW public.portfolio_performance_rankings AS
WITH portfolio_summary AS (
    SELECT 
        t.user_id,
        t.crypto_symbol,
        SUM(CASE WHEN t.transaction_type = 'buy' THEN t.amount ELSE 0 END) as total_quantity,
        SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as invested_amount,
        AVG(CASE WHEN t.transaction_type = 'buy' THEN t.price_usd END) as avg_buy_price,
        COUNT(CASE WHEN t.transaction_type = 'buy' THEN 1 END) as buy_count,
        MAX(t.transaction_date) as last_transaction_date
    FROM public.transactions t
    WHERE t.transaction_type = 'buy'
    GROUP BY t.user_id, t.crypto_symbol
),
current_prices AS (
    -- Dados simulados de preços atuais (em produção, viriam de uma API)
    SELECT 
        'BTC' as crypto_symbol, 45000.00 as current_price
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
        (((ps.total_quantity * cp.current_price) - ps.invested_amount) / ps.invested_amount * 100) as return_percent
    FROM portfolio_summary ps
    JOIN current_prices cp ON ps.crypto_symbol = cp.crypto_symbol
    WHERE ps.invested_amount > 100 -- Filtro de elegibilidade
),
user_totals AS (
    SELECT 
        pv.user_id,
        SUM(pv.invested_amount) as total_invested,
        SUM(pv.current_value) as total_current_value,
        SUM(pv.unrealized_pnl) as total_unrealized_pnl,
        (SUM(pv.unrealized_pnl) / SUM(pv.invested_amount) * 100) as total_return_percent,
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

-- Índices para otimização
CREATE INDEX idx_portfolio_rankings_user_id ON public.portfolio_performance_rankings (user_id, time_window);
CREATE INDEX idx_portfolio_rankings_return_percent ON public.portfolio_performance_rankings (return_percent DESC, time_window);
CREATE INDEX idx_portfolio_rankings_top_asset ON public.portfolio_performance_rankings (top_asset_return DESC, time_window);
CREATE INDEX idx_portfolio_rankings_dca ON public.portfolio_performance_rankings (dca_purchase_count DESC, time_window);

-- Comentários para documentação
COMMENT ON MATERIALIZED VIEW public.portfolio_performance_rankings IS 'Ranking de performance de portfólios dos usuários para 7 e 30 dias';
COMMENT ON COLUMN public.portfolio_performance_rankings.return_percent IS 'Retorno percentual total do portfólio';
COMMENT ON COLUMN public.portfolio_performance_rankings.top_asset IS 'Ativo com melhor performance individual';
COMMENT ON COLUMN public.portfolio_performance_rankings.top_asset_return IS 'Retorno percentual do melhor ativo';
COMMENT ON COLUMN public.portfolio_performance_rankings.dca_purchase_count IS 'Número total de compras (DCA)';
COMMENT ON COLUMN public.portfolio_performance_rankings.dca_avg_price IS 'Preço médio ponderado das compras';
COMMENT ON COLUMN public.portfolio_performance_rankings.badge IS 'Badge especial baseado no desempenho';

-- Função para atualizar a materialized view
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.portfolio_performance_rankings;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rankings quando transações são modificadas
CREATE OR REPLACE FUNCTION public.update_rankings_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar rankings após inserção/atualização de transações
    PERFORM public.refresh_portfolio_rankings();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rankings
CREATE TRIGGER trigger_update_rankings
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rankings_on_transaction(); 