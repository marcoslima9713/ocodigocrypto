-- ================================================
-- Correção Específica da Linha 154
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- O problema está na comparação WHERE ups.user_id = u.id::text
-- Vamos corrigir isso de forma mais explícita

-- 1. Primeiro, vamos dropar a view problemática
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;

-- 2. Recriar a view com a correção específica
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
  WHERE (b.qty_buy - COALESCE(s.qty_sell, 0)) > 0
),
portfolio_values AS (
  SELECT
    p.user_id,
    SUM(p.invested_usd) AS total_invested,
    SUM(p.qty * COALESCE(cp.price_usd, 0)) AS total_current_value
  FROM positions p
  LEFT JOIN public.crypto_prices cp ON p.crypto_symbol = cp.crypto_symbol
  GROUP BY p.user_id
),
eligible AS (
  SELECT
    user_id,
    total_invested,
    total_current_value,
    (total_current_value - total_invested) AS profit_usd,
    CASE 
      WHEN total_invested > 0 THEN ((total_current_value - total_invested) / total_invested * 100)
      ELSE 0 
    END as return_percent
  FROM portfolio_values
  WHERE total_current_value > total_invested
    AND total_invested >= 100
),
user_info AS (
  SELECT 
    e.user_id,
    e.total_invested,
    e.total_current_value,
    e.profit_usd,
    e.return_percent,
    u.id::text as auth_user_id,
    u.email,
    u.created_at,
    m.full_name
  FROM eligible e
  JOIN auth.users u ON u.id::text = e.user_id
  LEFT JOIN public.members m ON m.id::text = e.user_id
)
SELECT
  ui.auth_user_id AS user_id,
  COALESCE(ui.full_name, ui.email) AS user_name,
  ui.email AS user_email,
  ui.total_invested,
  ui.total_current_value,
  ui.profit_usd,
  ROUND(ui.return_percent, 2) AS return_percent,
  ui.created_at AS user_created_at
FROM user_info ui
WHERE 
  ui.created_at < NOW() - INTERVAL '1 hour'
  AND EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups 
    WHERE ups.user_id = ui.auth_user_id AND ups.show_in_community_feed = true
  )
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.user_id = ui.auth_user_id
  )
ORDER BY ui.return_percent DESC;

-- 3. Recriar o índice
CREATE INDEX IF NOT EXISTS idx_rankings_v2_return_desc
  ON public.portfolio_performance_rankings_v2 (return_percent DESC);

-- 4. Verificar se funcionou
SELECT 'Correção da linha 154 concluída!' as status;

-- 5. Testar
SELECT COUNT(*) as total_rankings FROM public.portfolio_performance_rankings_v2;

-- ================================================
-- Fim da correção específica
-- ================================================
