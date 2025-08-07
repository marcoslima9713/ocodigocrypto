-- Adicionar coluna de origem e backfill do community_feed

-- 1) Add column para vincular a transação de origem
ALTER TABLE public.community_feed
ADD COLUMN IF NOT EXISTS source_transaction_id UUID UNIQUE;

-- 2) Atualizar função para registrar a transação de origem
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
    action_type, asset, amount, price, total_value, pnl_percent, pnl_amount,
    source_transaction_id, created_at
  ) VALUES (
    NEW.user_id, v_display_name, v_username,
    NEW.transaction_type, NEW.crypto_symbol, NEW.amount,
    NEW.price_usd, NEW.total_usd, NULL, NULL,
    NEW.id, NEW.transaction_date
  )
  ON CONFLICT (source_transaction_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_community_feed
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.insert_community_feed_from_transaction();

-- 3) Backfill para transações existentes (somente públicos)
INSERT INTO public.community_feed (
  user_id, user_display_name, user_username,
  action_type, asset, amount, price, total_value, pnl_percent, pnl_amount,
  source_transaction_id, created_at
)
SELECT
  t.user_id,
  COALESCE(m.full_name, au.raw_user_meta_data->>'display_name', au.email, 'Usuário Anônimo') AS display_name,
  au.raw_user_meta_data->>'username' AS username,
  t.transaction_type,
  t.crypto_symbol,
  t.amount,
  t.price_usd,
  t.total_usd,
  NULL AS pnl_percent,
  NULL AS pnl_amount,
  t.id AS source_transaction_id,
  t.transaction_date AS created_at
FROM public.transactions t
JOIN public.user_privacy_settings ups
  ON ups.user_id::text = t.user_id AND ups.show_in_community_feed = true
LEFT JOIN auth.users au ON au.id::text = t.user_id
LEFT JOIN public.members m ON m.id::text = t.user_id
ON CONFLICT (source_transaction_id) DO NOTHING;
