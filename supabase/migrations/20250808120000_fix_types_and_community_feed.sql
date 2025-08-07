-- Corrigir tipos TEXT vs UUID e recriar community_feed + função/trigger + políticas + view de rankings

-- 0) Dropar MV de rankings antes de alterar tipos que possam estar em uso
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;

-- 1) Garantir que colunas user_id sejam TEXT (apenas tabelas do app)
DO $$
BEGIN
  -- transactions.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='transactions' AND column_name='user_id' AND data_type <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT USING user_id::text';
  END IF;

  -- portfolio_holdings.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='portfolio_holdings' AND column_name='user_id' AND data_type <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE public.portfolio_holdings ALTER COLUMN user_id TYPE TEXT USING user_id::text';
  END IF;

  -- NÃO alterar user_privacy_settings.user_id (pode ser FK UUID para auth.users)
END$$;

-- 2) Recriar tabela community_feed caso não exista
CREATE TABLE IF NOT EXISTS public.community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_display_name TEXT NOT NULL,
  user_username TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('buy','sell','add')),
  asset TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  total_value NUMERIC NOT NULL CHECK (total_value >= 0),
  pnl_percent NUMERIC,
  pnl_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_asset CHECK (asset ~ '^[A-Z]{2,10}$')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_feed_created_at ON public.community_feed (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_feed_user_id   ON public.community_feed (user_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_action    ON public.community_feed (action_type);
CREATE INDEX IF NOT EXISTS idx_community_feed_asset     ON public.community_feed (asset);

-- 3) RLS + política de leitura
ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_feed_select ON public.community_feed;
CREATE POLICY public_feed_select
ON public.community_feed
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups
    WHERE ups.user_id::text = community_feed.user_id
      AND ups.show_in_community_feed = true
  )
);

-- 4) Função e trigger de inserção a partir de transactions
DROP TRIGGER IF EXISTS trigger_insert_community_feed ON public.transactions;
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();

CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_username TEXT;
BEGIN
  SELECT
    COALESCE(m.full_name, au.raw_user_meta_data->>'display_name', au.email, 'Usuário Anônimo') AS display_name,
    au.raw_user_meta_data->>'username' AS username
  INTO v_display_name, v_username
  FROM auth.users au
  LEFT JOIN public.members m ON m.id::text = NEW.user_id
  WHERE au.id::text = NEW.user_id;

  INSERT INTO public.community_feed (
    user_id, user_display_name, user_username,
    action_type, asset, amount, price, total_value, pnl_percent, pnl_amount
  ) VALUES (
    NEW.user_id, v_display_name, v_username,
    NEW.transaction_type, NEW.crypto_symbol, NEW.amount,
    NEW.price_usd, NEW.total_usd, NULL, NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_community_feed
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.insert_community_feed_from_transaction();

-- 5) Recriar a MV de rankings com joins em TEXT e janela de 1 hora
CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2 AS
WITH buys AS (
  SELECT user_id, crypto_symbol,
         SUM(amount) AS qty_buy,
         SUM(total_usd) AS invested_usd
  FROM public.transactions
  WHERE transaction_type = 'buy'
  GROUP BY user_id, crypto_symbol
),
sells AS (
  SELECT user_id, crypto_symbol,
         SUM(amount) AS qty_sell,
         SUM(total_usd) AS redeemed_usd
  FROM public.transactions
  WHERE transaction_type = 'sell'
  GROUP BY user_id, crypto_symbol
),
positions AS (
  SELECT b.user_id, b.crypto_symbol,
         (b.qty_buy - COALESCE(s.qty_sell, 0)) AS qty,
         (b.invested_usd - COALESCE(s.redeemed_usd, 0)) AS invested_usd
  FROM buys b
  LEFT JOIN sells s ON s.user_id = b.user_id AND s.crypto_symbol = b.crypto_symbol
  WHERE (b.qty_buy - COALESCE(s.qty_sell, 0)) > 0
),
portfolio_values AS (
  SELECT p.user_id,
         SUM(p.invested_usd) AS total_invested,
         SUM(p.qty * cp.price_usd) AS total_current_value
  FROM positions p
  JOIN public.crypto_prices cp ON p.crypto_symbol = cp.crypto_symbol
  GROUP BY p.user_id
),
eligible AS (
  SELECT user_id,
         total_invested,
         total_current_value,
         (total_current_value - total_invested) AS profit_usd,
         CASE WHEN total_invested > 0 THEN ((total_current_value - total_invested) / total_invested * 100) ELSE 0 END AS return_percent
  FROM portfolio_values
  WHERE total_current_value > total_invested
    AND total_invested >= 100
)
SELECT
  u.id::text AS user_id,
  COALESCE(m.full_name, u.email) AS user_name,
  u.email AS user_email,
  e.total_invested,
  e.total_current_value,
  e.profit_usd,
  ROUND(e.return_percent, 2) AS return_percent,
  u.created_at AS user_created_at
FROM eligible e
JOIN auth.users u ON u.id::text = e.user_id
LEFT JOIN public.members m ON m.id::text = e.user_id
WHERE 
  u.created_at < NOW() - INTERVAL '1 hour'
  AND EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups 
    WHERE ups.user_id::text = u.id::text AND ups.show_in_community_feed = true
  )
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.user_id = u.id::text
  )
ORDER BY return_percent DESC;

CREATE INDEX IF NOT EXISTS idx_rankings_v2_return_desc
  ON public.portfolio_performance_rankings_v2 (return_percent DESC);
