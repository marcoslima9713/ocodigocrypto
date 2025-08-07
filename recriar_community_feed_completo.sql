-- ================================================
-- RECRIAR community_feed + RLS + Função + Trigger
-- Execute no SQL Editor do Supabase
-- ================================================

-- Extensão necessária para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Garantir tabela user_privacy_settings (TEXT)
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  user_id TEXT PRIMARY KEY,
  show_in_community_feed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Recriar tabela community_feed (se não existir)
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

-- 3) Índices
CREATE INDEX IF NOT EXISTS idx_community_feed_created_at ON public.community_feed (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_feed_user_id   ON public.community_feed (user_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_action    ON public.community_feed (action_type);
CREATE INDEX IF NOT EXISTS idx_community_feed_asset     ON public.community_feed (asset);

-- 4) RLS e política de leitura pública (apenas usuários com perfil público)
ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_feed_select ON public.community_feed;
CREATE POLICY public_feed_select
ON public.community_feed
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups
    WHERE ups.user_id = community_feed.user_id
      AND ups.show_in_community_feed = true
  )
);

-- 5) Função para inserir entradas no feed a partir de transactions
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

-- 6) Verificações
SELECT 'OK - community_feed existe' AS check_cf, to_regclass('public.community_feed') AS rel;
SELECT 'OK - policy aplicada' AS check_policy
WHERE EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='community_feed' AND policyname='public_feed_select'
);
-- ================================================
