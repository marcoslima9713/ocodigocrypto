-- Tornar community_feed legível publicamente e inserível apenas pelos usuários
alter table public.community_feed enable row level security;

drop policy if exists "Public can read community feed" on public.community_feed;
create policy "Public can read community feed" on public.community_feed
  for select using (true);

drop policy if exists "Users can insert their own feed entries" on public.community_feed;
create policy "Users can insert their own feed entries" on public.community_feed
  for insert with check (auth.role() = 'authenticated');

-- Corrigir segurança do feed e garantir políticas de transactions

-- 1) Recriar função do feed com SECURITY DEFINER para poder ler auth.users
DROP TRIGGER IF EXISTS trigger_insert_community_feed ON public.transactions;
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();

CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

CREATE TRIGGER trigger_insert_community_feed
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.insert_community_feed_from_transaction();

-- 2) Recriar políticas de transactions (idempotente)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tx_select ON public.transactions;
CREATE POLICY tx_select
ON public.transactions FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS tx_insert ON public.transactions;
CREATE POLICY tx_insert
ON public.transactions FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS tx_update ON public.transactions;
CREATE POLICY tx_update
ON public.transactions FOR UPDATE
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS tx_delete ON public.transactions;
CREATE POLICY tx_delete
ON public.transactions FOR DELETE
USING (auth.uid()::text = user_id);
