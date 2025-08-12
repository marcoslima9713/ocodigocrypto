-- Fix security issues: Remove auth.users exposure and enable RLS
-- First, drop the problematic materialized view that exposes auth.users
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;

-- Enable RLS on tables that don't have it
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_update_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create a secure version of the rankings view that doesn't expose auth.users
-- This version gets user data from members table and user_privacy_settings
CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2 AS
WITH buys AS (
  SELECT 
    transactions.user_id,
    transactions.crypto_symbol,
    sum(transactions.amount) AS qty_buy,
    sum(transactions.total_usd) AS invested_usd
  FROM transactions
  WHERE (transactions.transaction_type = 'buy'::text)
  GROUP BY transactions.user_id, transactions.crypto_symbol
), 
sells AS (
  SELECT 
    transactions.user_id,
    transactions.crypto_symbol,
    sum(transactions.amount) AS qty_sell,
    sum(transactions.total_usd) AS redeemed_usd
  FROM transactions
  WHERE (transactions.transaction_type = 'sell'::text)
  GROUP BY transactions.user_id, transactions.crypto_symbol
), 
positions AS (
  SELECT 
    b.user_id,
    b.crypto_symbol,
    (b.qty_buy - COALESCE(s.qty_sell, (0)::numeric)) AS qty,
    (b.invested_usd - COALESCE(s.redeemed_usd, (0)::numeric)) AS invested_usd
  FROM (buys b LEFT JOIN sells s ON (((s.user_id = b.user_id) AND (s.crypto_symbol = b.crypto_symbol))))
  WHERE ((b.qty_buy - COALESCE(s.qty_sell, (0)::numeric)) > (0)::numeric)
), 
portfolio_values AS (
  SELECT 
    p.user_id,
    sum(p.invested_usd) AS total_invested,
    sum((p.qty * cp.price_usd)) AS total_current_value
  FROM (positions p JOIN crypto_prices cp ON ((p.crypto_symbol = cp.crypto_symbol)))
  GROUP BY p.user_id
), 
eligible AS (
  SELECT 
    portfolio_values.user_id,
    portfolio_values.total_invested,
    portfolio_values.total_current_value,
    (portfolio_values.total_current_value - portfolio_values.total_invested) AS profit_usd,
    CASE
      WHEN (portfolio_values.total_invested > (0)::numeric) 
      THEN (((portfolio_values.total_current_value - portfolio_values.total_invested) / portfolio_values.total_invested) * (100)::numeric)
      ELSE (0)::numeric
    END AS return_percent
  FROM portfolio_values
  WHERE ((portfolio_values.total_current_value > portfolio_values.total_invested) AND (portfolio_values.total_invested >= (100)::numeric))
)
SELECT 
  e.user_id,
  COALESCE(m.full_name, 'Usuário Anônimo') AS user_name,
  m.email AS user_email,
  e.total_invested,
  e.total_current_value,
  e.profit_usd,
  round(e.return_percent, 2) AS return_percent,
  m.created_at AS user_created_at
FROM eligible e
LEFT JOIN members m ON (m.id::text = e.user_id)
WHERE EXISTS (
  SELECT 1 FROM user_privacy_settings ups 
  WHERE ups.user_id::text = e.user_id 
  AND ups.show_in_community_feed = true
)
AND EXISTS (
  SELECT 1 FROM transactions t 
  WHERE t.user_id = e.user_id
)
ORDER BY round(e.return_percent, 2) DESC;

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_performance_rankings_v2_user_id_idx 
ON public.portfolio_performance_rankings_v2 (user_id);

-- Add RLS policies for crypto_prices (public readable)
CREATE POLICY "crypto_prices_select_policy" ON public.crypto_prices
FOR SELECT USING (true);

-- Add RLS policies for crypto_images (already has some policies but ensure consistency)
-- The existing policies look correct

-- Add RLS policies for user_privacy_settings
CREATE POLICY "user_privacy_settings_select_policy" ON public.user_privacy_settings
FOR SELECT USING (user_id::text = get_firebase_uid());

CREATE POLICY "user_privacy_settings_insert_policy" ON public.user_privacy_settings
FOR INSERT WITH CHECK (user_id::text = get_firebase_uid());

CREATE POLICY "user_privacy_settings_update_policy" ON public.user_privacy_settings
FOR UPDATE USING (user_id::text = get_firebase_uid());

-- Add RLS policies for ranking_update_log (admin only)
CREATE POLICY "ranking_update_log_admin_policy" ON public.ranking_update_log
FOR ALL USING (has_role(get_firebase_uid(), 'admin'::app_role));

-- Add RLS policies for module_covers (public readable)
CREATE POLICY "module_covers_select_policy" ON public.module_covers
FOR SELECT USING (true);

-- portfolio_holdings already has correct policies

-- members table already has some policies but ensure they work with Firebase
-- The existing policies look correct for the current setup