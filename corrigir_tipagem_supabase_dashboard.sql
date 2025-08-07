-- ================================================
-- Correção de Tipagem para Supabase Dashboard
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- 1. Primeiro, vamos dropar as views e funções problemáticas
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();
DROP TRIGGER IF EXISTS trigger_insert_community_feed ON public.transactions;
DROP TRIGGER IF EXISTS trg_refresh_rankings_v2 ON public.transactions;

-- 2. Corrigir a função do community_feed
CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir no feed apenas se for uma transação pública (não privada)
    INSERT INTO public.community_feed (
        user_id,
        user_display_name,
        user_username,
        action_type,
        asset,
        amount,
        price,
        total_value,
        pnl_percent,
        pnl_amount
    )
    SELECT 
        t.user_id,
        COALESCE(u.display_name, 'Usuário Anônimo'),
        u.username,
        t.transaction_type,
        t.crypto_symbol,
        t.amount,
        t.price_usd,
        t.total_usd,
        -- Calcular P&L se for uma venda
        CASE 
            WHEN t.transaction_type = 'sell' THEN
                (t.price_usd - (
                    SELECT AVG(price_usd) 
                    FROM public.transactions 
                    WHERE user_id = t.user_id 
                    AND crypto_symbol = t.crypto_symbol 
                    AND transaction_type = 'buy'
                    AND transaction_date < t.transaction_date
                )) / (
                    SELECT AVG(price_usd) 
                    FROM public.transactions 
                    WHERE user_id = t.user_id 
                    AND crypto_symbol = t.crypto_symbol 
                    AND transaction_type = 'buy'
                    AND transaction_date < t.transaction_date
                ) * 100
            ELSE NULL
        END,
        CASE 
            WHEN t.transaction_type = 'sell' THEN
                (t.price_usd - (
                    SELECT AVG(price_usd) 
                    FROM public.transactions 
                    WHERE user_id = t.user_id 
                    AND crypto_symbol = t.crypto_symbol 
                    AND transaction_type = 'buy'
                    AND transaction_date < t.transaction_date
                )) * t.amount
            ELSE NULL
        END
    FROM public.transactions t
    LEFT JOIN auth.users u ON t.user_id = u.id::text
    WHERE t.id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger do community_feed
CREATE TRIGGER trigger_insert_community_feed
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_community_feed_from_transaction();

-- 4. Corrigir a view do portfolio_rankings
CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2 AS
WITH buys AS (
  SELECT
    user_id,
    crypto_symbol,
    SUM(amount)    AS qty_buy,
    SUM(total_usd) AS invested_usd
  FROM public.transactions
  WHERE transaction_type = 'buy'
  GROUP BY user_id, crypto_symbol
),
sells AS (
  SELECT
    user_id,
    crypto_symbol,
    SUM(amount)    AS qty_sell,
    SUM(total_usd) AS redeemed_usd
  FROM public.transactions
  WHERE transaction_type = 'sell'
  GROUP BY user_id, crypto_symbol
),
positions AS (
  SELECT
    b.user_id,
    b.crypto_symbol,
    (b.qty_buy   - COALESCE(s.qty_sell, 0)) AS qty,
    (b.invested_usd - COALESCE(s.redeemed_usd, 0)) AS invested_usd
  FROM buys b
  LEFT JOIN sells s
    ON s.user_id = b.user_id
   AND s.crypto_symbol = b.crypto_symbol
  WHERE (b.qty_buy - COALESCE(s.qty_sell, 0)) > 0  -- ignora posições zeradas
),
portfolio_values AS (
  SELECT
    p.user_id,
    SUM(p.invested_usd)                                     AS total_invested,
    SUM(p.qty * cp.price_usd)                               AS total_current_value
  FROM positions p
  JOIN public.crypto_prices cp ON p.crypto_symbol = cp.crypto_symbol
  GROUP BY p.user_id
),
eligible AS (
  SELECT
    user_id,
    total_invested,
    total_current_value,
    (total_current_value - total_invested)                         AS profit_usd,
    ((total_current_value - total_invested) / total_invested * 100) as return_percent
  FROM portfolio_values
  WHERE total_current_value > total_invested  -- somente usuários com lucro
    AND total_invested >= 100  -- investimento mínimo $100
)
SELECT
  u.id                                       AS user_id,
  COALESCE(m.full_name, u.email)             AS user_name,
  u.email                                    AS user_email,
  e.total_invested,
  e.total_current_value,
  e.profit_usd,
  ROUND(e.return_percent, 2)                 AS return_percent,
  u.created_at                               AS user_created_at
FROM eligible e
JOIN auth.users u     ON u.id::text = e.user_id
LEFT JOIN public.members m ON m.id::text = e.user_id
WHERE 
  u.created_at < NOW() - INTERVAL '1 hour'  -- conta ativa há pelo menos 1 hora
  AND EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups 
    WHERE ups.user_id = u.id::text AND ups.show_in_community_feed = true
  )  -- perfil público ativado
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.user_id = u.id::text
  )  -- tem transações registradas
ORDER BY return_percent DESC;

-- 5. Recriar o índice
CREATE INDEX IF NOT EXISTS idx_rankings_v2_return_desc
  ON public.portfolio_performance_rankings_v2 (return_percent DESC);

-- 6. Recriar a função de refresh
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings_v2()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.portfolio_performance_rankings_v2;
END;
$$ LANGUAGE plpgsql;

-- 7. Recriar o trigger de atualização
CREATE OR REPLACE FUNCTION public.trg_refresh_rankings_v2()
RETURNS trigger AS $$
BEGIN
  PERFORM public.refresh_portfolio_rankings_v2();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_rankings_v2
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_refresh_rankings_v2();

-- 8. Verificar se tudo está funcionando
SELECT 'Correção concluída!' as status;

-- 9. Testar a função do community_feed
SELECT 'Função community_feed criada com sucesso' as status;

-- 10. Testar a view do portfolio_rankings
SELECT COUNT(*) as total_rankings FROM public.portfolio_performance_rankings_v2;

-- ================================================
-- Fim da correção
-- ================================================
