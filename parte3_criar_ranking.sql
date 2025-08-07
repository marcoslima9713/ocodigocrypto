-- PARTE 3: Criar ranking do usuário Marcos
-- Execute este script após os dois primeiros

-- Inserir ranking diretamente na tabela
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
) VALUES 
-- Ranking para 7 dias
(
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'Marcos Fut',
    'marcosfut',
    '2025-08-05 00:01:00',
    '7_days',
    2.5,
    'BTC',
    3.2,
    8,
    45000.00,
    25000.00,
    25625.00,
    625.00,
    'DCA Master'
),
-- Ranking para 30 dias
(
    '856d169f-8563-4126-a348-fdedb4f3259f',
    'Marcos Fut',
    'marcosfut',
    '2025-08-05 00:01:00',
    '30_days',
    2.5,
    'BTC',
    3.2,
    8,
    45000.00,
    25000.00,
    25625.00,
    625.00,
    'DCA Master'
);

-- Verificar se o ranking foi inserido
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
