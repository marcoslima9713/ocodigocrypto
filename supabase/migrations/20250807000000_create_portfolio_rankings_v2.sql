-- ================================================
-- Migration: 2025-08-07 – Nova Materialized View
--            Portfolio Performance Rankings v2
-- ================================================
-- Recria totalmente o cálculo do ranking de performance
-- seguindo as regras definidas no projeto.
-- • Inclusão automática de novos usuários
-- • Elegibilidade: somente usuários com lucro (> 0)
-- • Base real de usuários (auth.users / members)
-- • Dados vindos das transações + preços CoinGecko
-- • Atualização automática via trigger
-- ================================================

-- 1) Tabela auxiliar de preços -------------------
-- Esta tabela deve ser alimentada periodicamente por
-- uma Edge Function (ou cron) que consome a API CoinGecko
-- e armazena o preço USD mais recente de cada cripto.
-- Se já existir, pule esta criação.
CREATE TABLE IF NOT EXISTS public.crypto_prices (
  crypto_symbol TEXT PRIMARY KEY,
  price_usd     NUMERIC(20,8) NOT NULL,
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 2) Materialized View ---------------------------
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;

CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2
AS
WITH buys AS (
  SELECT
    user_id,
    crypto_symbol,
    SUM(amount)           AS qty_buy,
    SUM(total_usd)        AS invested_usd
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

-- 3) Índices -------------------------------------
CREATE INDEX IF NOT EXISTS idx_rankings_v2_return_desc
  ON public.portfolio_performance_rankings_v2 (return_percent DESC);

-- 4) Função de refresh ---------------------------
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings_v2()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.portfolio_performance_rankings_v2;
END;
$$ LANGUAGE plpgsql;

-- 5) Trigger para atualização automática ---------
-- Sempre que uma transação for inserida/atualizada/deletada,
-- re-atualizamos a view.
CREATE OR REPLACE FUNCTION public.trg_refresh_rankings_v2()
RETURNS trigger AS $$
BEGIN
  PERFORM public.refresh_portfolio_rankings_v2();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_rankings_v2 ON public.transactions;
CREATE TRIGGER trg_refresh_rankings_v2
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_refresh_rankings_v2();

-- ================================================
-- Fim da migração
-- ================================================
