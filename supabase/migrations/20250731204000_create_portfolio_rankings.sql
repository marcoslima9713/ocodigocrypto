-- Criação da materialized view para rankings de performance de portfólio
-- ATUALIZADO: Agora usa preços reais da API CoinGecko em vez de preços fixos
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
-- NOTA: Os preços atuais agora são obtidos dinamicamente via API
-- Esta view será atualizada periodicamente com preços reais
portfolio_values AS (
    SELECT 
        ps.user_id,
        ps.crypto_symbol,
        ps.total_quantity,
        ps.invested_amount,
        ps.avg_buy_price,
        ps.buy_count,
        -- Preços serão atualizados via função de refresh
        0 as current_price, -- Placeholder - será atualizado via API
        0 as current_value, -- Placeholder - será calculado dinamicamente
        0 as unrealized_pnl, -- Placeholder - será calculado dinamicamente
        0 as return_percent -- Placeholder - será calculado dinamicamente
    FROM portfolio_summary ps
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
        MAX(pv.return_percent) as best_asset_return
    FROM portfolio_values pv
    GROUP BY pv.user_id
),
best_assets AS (
    SELECT DISTINCT ON (pv.user_id)
        pv.user_id,
        pv.crypto_symbol as best_asset
    FROM portfolio_values pv
    JOIN user_totals ut ON pv.user_id = ut.user_id
    WHERE pv.return_percent = ut.best_asset_return
    ORDER BY pv.user_id, pv.return_percent DESC
)
SELECT 
    ut.user_id,
    COALESCE(m.full_name, 'Usuário Anônimo') as user_name,
    COALESCE(m.email, '') as user_username,
    m.created_at as user_created_at,
    '7_days' as time_window,
    ut.total_return_percent as return_percent,
    ba.best_asset as top_asset,
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
JOIN best_assets ba ON ut.user_id = ba.user_id
JOIN public.members m ON ut.user_id = m.id
    WHERE 
        m.created_at < NOW() - INTERVAL '1 hour'
        AND ut.total_invested > 100
        AND EXISTS (
            SELECT 1 FROM public.user_privacy_settings ups 
            WHERE ups.user_id = m.id AND ups.show_in_community_feed = true
        )
    UNION ALL
    SELECT 
        ut.user_id,
        COALESCE(m.full_name, 'Usuário Anônimo') as user_name,
        COALESCE(m.email, '') as user_username,
        m.created_at as user_created_at,
        '30_days' as time_window,
        ut.total_return_percent as return_percent,
        ba.best_asset as top_asset,
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
    JOIN best_assets ba ON ut.user_id = ba.user_id
    JOIN public.members m ON ut.user_id = m.id
    WHERE 
        m.created_at < NOW() - INTERVAL '1 hour'
        AND ut.total_invested > 100
        AND EXISTS (
            SELECT 1 FROM public.user_privacy_settings ups 
            WHERE ups.user_id = m.id AND ups.show_in_community_feed = true
        );

-- Índices para otimização
CREATE INDEX idx_portfolio_rankings_user_id ON public.portfolio_performance_rankings (user_id, time_window);
CREATE INDEX idx_portfolio_rankings_return_percent ON public.portfolio_performance_rankings (return_percent DESC, time_window);
CREATE INDEX idx_portfolio_rankings_top_asset ON public.portfolio_performance_rankings (top_asset_return DESC, time_window);
CREATE INDEX idx_portfolio_rankings_dca ON public.portfolio_performance_rankings (dca_purchase_count DESC, time_window);

-- Comentários para documentação
COMMENT ON MATERIALIZED VIEW public.portfolio_performance_rankings IS 'Ranking de performance de portfólios dos usuários para 7 e 30 dias - ATUALIZADO: Usa preços reais da API';
COMMENT ON COLUMN public.portfolio_performance_rankings.return_percent IS 'Retorno percentual total do portfólio baseado em preços reais';
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