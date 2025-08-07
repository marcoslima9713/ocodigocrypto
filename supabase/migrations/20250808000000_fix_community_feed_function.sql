-- Corrigir a função do community_feed para usar TEXT e metadados corretos

-- 1) Dropar TRIGGER antes da função (ordem correta)
DROP TRIGGER IF EXISTS trigger_insert_community_feed ON public.transactions;

-- 2) Dropar função antiga
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();

-- 3) Recriar a função corrigida (usa members.full_name ou raw_user_meta_data)
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
  ) VALUES (
    NEW.user_id,
    v_display_name,
    v_username,
    NEW.transaction_type,
    NEW.crypto_symbol,
    NEW.amount,
    NEW.price_usd,
    NEW.total_usd,
    NULL,
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Recriar o trigger
CREATE TRIGGER trigger_insert_community_feed
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_community_feed_from_transaction();
