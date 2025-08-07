-- Corrigir o JOIN na view do portfolio_rankings para usar TEXT em vez de UUID
-- Esta migração corrige o erro: operator does not exist: text = uuid

-- Primeiro, vamos dropar a view existente
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;

-- Recriar a view com o JOIN corrigido
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
    WHERE ups.user_id::text = u.id::text AND ups.show_in_community_feed = true
  )  -- perfil público ativado
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.user_id = u.id::text
  )  -- tem transações registradas
ORDER BY return_percent DESC;

-- Recriar o índice
CREATE INDEX IF NOT EXISTS idx_rankings_v2_return_desc
  ON public.portfolio_performance_rankings_v2 (return_percent DESC);
