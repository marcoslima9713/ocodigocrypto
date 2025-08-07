-- ================================================
-- Correção Emergencial de Tipagem - TEXT vs UUID
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- 1. Dropar tudo primeiro
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();
DROP TRIGGER IF EXISTS trigger_insert_community_feed ON public.transactions;
DROP TRIGGER IF EXISTS trg_refresh_rankings_v2 ON public.transactions;

-- 2. Função do community_feed (versão mais simples)
CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
    user_display_name TEXT;
    user_username TEXT;
BEGIN
    -- Buscar informações do usuário
    SELECT COALESCE(display_name, 'Usuário Anônimo'), username 
    INTO user_display_name, user_username
    FROM auth.users 
    WHERE id::text = NEW.user_id;
    
    -- Inserir no feed
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
        user_display_name,
        user_username,
        NEW.transaction_type,
        NEW.crypto_symbol,
        NEW.amount,
        NEW.price_usd,
        NEW.total_usd,
        NULL, NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger
CREATE TRIGGER trigger_insert_community_feed
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_community_feed_from_transaction();

-- 4. View do portfolio_rankings (versão mais simples)
CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2 AS
WITH user_transactions AS (
  SELECT 
    t.user_id,
    u.id::text as auth_user_id,
    u.email,
    m.full_name,
    u.created_at,
    SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as total_invested,
    SUM(CASE WHEN t.transaction_type = 'sell' THEN t.total_usd ELSE 0 END) as total_sold,
    COUNT(*) as transaction_count
  FROM public.transactions t
  JOIN auth.users u ON t.user_id = u.id::text
  LEFT JOIN public.members m ON m.id::text = t.user_id
  GROUP BY t.user_id, u.id, u.email, m.full_name, u.created_at
),
user_privacy AS (
  SELECT user_id, show_in_community_feed
  FROM public.user_privacy_settings
  WHERE show_in_community_feed = true
)
SELECT 
  ut.auth_user_id as user_id,
  COALESCE(ut.full_name, ut.email) as user_name,
  ut.email as user_email,
  ut.total_invested,
  ut.total_invested as total_current_value, -- Simplificado
  (ut.total_invested - ut.total_sold) as profit_usd,
  CASE 
    WHEN ut.total_invested > 0 THEN 
      ROUND(((ut.total_invested - ut.total_sold) / ut.total_invested * 100), 2)
    ELSE 0 
  END as return_percent,
  ut.created_at as user_created_at
FROM user_transactions ut
JOIN user_privacy up ON up.user_id = ut.user_id
WHERE 
  ut.created_at < NOW() - INTERVAL '1 hour'
  AND ut.total_invested >= 100
  AND ut.transaction_count >= 1
ORDER BY return_percent DESC;

-- 5. Recriar o índice
CREATE INDEX IF NOT EXISTS idx_rankings_v2_return_desc
  ON public.portfolio_performance_rankings_v2 (return_percent DESC);

-- 6. Função de refresh
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings_v2()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.portfolio_performance_rankings_v2;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger de atualização
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

-- 8. Verificar se funcionou
SELECT 'Correção emergencial concluída!' as status;

-- 9. Testar
SELECT COUNT(*) as total_rankings FROM public.portfolio_performance_rankings_v2;

-- ================================================
-- Fim da correção emergencial
-- ================================================
