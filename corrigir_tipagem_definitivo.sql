-- ================================================
-- Correção Definitiva de Tipagem - TEXT vs UUID
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- 1. Limpar tudo primeiro
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();
DROP TRIGGER IF EXISTS trigger_insert_community_feed ON public.transactions;
DROP TRIGGER IF EXISTS trg_refresh_rankings_v2 ON public.transactions;

-- 2. Função do community_feed (versão definitiva)
CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
    user_display_name TEXT;
    user_username TEXT;
BEGIN
    -- Buscar informações do usuário de forma segura
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

-- 4. View do portfolio_rankings (versão definitiva)
CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2 AS
WITH user_summary AS (
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
public_users AS (
  SELECT user_id
  FROM public.user_privacy_settings
  WHERE show_in_community_feed = true
)
SELECT 
  us.auth_user_id as user_id,
  COALESCE(us.full_name, us.email) as user_name,
  us.email as user_email,
  us.total_invested,
  us.total_invested as total_current_value, -- Simplificado por enquanto
  (us.total_invested - us.total_sold) as profit_usd,
  CASE 
    WHEN us.total_invested > 0 THEN 
      ROUND(((us.total_invested - us.total_sold) / us.total_invested * 100), 2)
    ELSE 0 
  END as return_percent,
  us.created_at as user_created_at
FROM user_summary us
JOIN public_users pu ON pu.user_id::text = us.user_id
WHERE 
  us.created_at < NOW() - INTERVAL '1 hour'
  AND us.total_invested >= 100
  AND us.transaction_count >= 1
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
SELECT 'Correção definitiva concluída!' as status;

-- 9. Testar
SELECT COUNT(*) as total_rankings FROM public.portfolio_performance_rankings_v2;

-- 10. Testar inserção de transação
-- (Descomente as linhas abaixo para testar)
/*
INSERT INTO public.transactions (
    user_id, portfolio_id, crypto_symbol, transaction_type, 
    amount, price_usd, total_usd
) VALUES (
    (SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com' LIMIT 1),
    'main', 'BTC', 'buy', 0.1, 45000, 4500
);
*/

-- ================================================
-- Fim da correção definitiva
-- ================================================
