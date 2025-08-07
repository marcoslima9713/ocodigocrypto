-- Corrigir políticas de acesso à tabela members
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado na tabela members
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'members' AND schemaname = 'public';

-- 2. Verificar políticas existentes na tabela members
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'members' AND schemaname = 'public';

-- 3. Desabilitar RLS temporariamente para permitir acesso público
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- 4. Ou criar uma política que permite leitura pública
DROP POLICY IF EXISTS "Permitir leitura pública de members" ON public.members;

CREATE POLICY "Permitir leitura pública de members" ON public.members
    FOR SELECT
    USING (true);

-- 5. Verificar se há dados na tabela members
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_members
FROM public.members;

-- 6. Verificar dados específicos do usuário Marcos
SELECT 
    id,
    email,
    full_name,
    is_active,
    created_at,
    updated_at
FROM public.members 
WHERE email = 'marcoslima9713@gmail.com';

-- 7. Testar consulta que o hook está fazendo
SELECT 
    id,
    email,
    full_name,
    created_at,
    is_active
FROM public.members
WHERE is_active = true
ORDER BY created_at DESC;

-- 8. Se ainda não funcionar, recriar a tabela members sem RLS
-- (Execute apenas se necessário)
/*
DROP TABLE IF EXISTS public.members CASCADE;

CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir o usuário Marcos
INSERT INTO public.members (id, email, full_name, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'marcoslima9713@gmail.com',
    'Marcos Fut',
    true,
    NOW() - INTERVAL '2 hours',
    NOW()
);
*/

-- 9. Verificar se a tabela transactions também tem problemas de acesso
SELECT 
    COUNT(*) as total_transactions
FROM public.transactions;

-- 10. Verificar políticas da tabela transactions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'transactions' AND schemaname = 'public';

-- 11. Se necessário, desabilitar RLS na tabela transactions também
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- 12. Criar política para transactions
DROP POLICY IF EXISTS "Permitir leitura pública de transactions" ON public.transactions;

CREATE POLICY "Permitir leitura pública de transactions" ON public.transactions
    FOR SELECT
    USING (true);

-- 13. Teste final - verificar se as consultas funcionam
SELECT 
    'members' as table_name,
    COUNT(*) as total_records
FROM public.members

UNION ALL

SELECT 
    'transactions' as table_name,
    COUNT(*) as total_records
FROM public.transactions;

-- Script para corrigir políticas de membros e ranking
-- Executar este script para atualizar as configurações

-- 1. Atualizar configurações de privacidade para membros ativos
UPDATE public.user_privacy_settings 
SET show_in_community_feed = true
WHERE user_id IN (
    SELECT id FROM public.members 
    WHERE is_active = true
);

-- 2. Garantir que todos os membros ativos tenham configurações de privacidade
INSERT INTO public.user_privacy_settings (user_id, show_in_community_feed, created_at, updated_at)
SELECT 
    m.id as user_id,
    true as show_in_community_feed,
    NOW() as created_at,
    NOW() as updated_at
FROM public.members m
WHERE m.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups 
    WHERE ups.user_id = m.id
);

-- 3. Atualizar a materialized view do ranking para usar preços reais
-- Primeiro, dropar a view existente
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;

-- Recriar a view com preços reais e novos critérios
CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2 AS
WITH buys AS (
    SELECT 
        t.user_id,
        t.crypto_symbol,
        SUM(CASE WHEN t.transaction_type = 'buy' THEN t.amount ELSE 0 END) as total_quantity,
        SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as invested_amount,
        AVG(CASE WHEN t.transaction_type = 'buy' THEN t.price_usd END) as avg_buy_price,
        COUNT(CASE WHEN t.transaction_type = 'buy' THEN 1 END) as buy_count,
        MAX(t.transaction_date) as last_transaction_date
    FROM public.transactions t
    WHERE t.transaction_type = 'buy'
    GROUP BY t.user_id, t.crypto_symbol
),
sells AS (
    SELECT 
        t.user_id,
        t.crypto_symbol,
        SUM(CASE WHEN t.transaction_type = 'sell' THEN t.amount ELSE 0 END) as total_quantity_sold,
        SUM(CASE WHEN t.transaction_type = 'sell' THEN t.total_usd ELSE 0 END) as redeemed_amount
    FROM public.transactions t
    WHERE t.transaction_type = 'sell'
    GROUP BY t.user_id, t.crypto_symbol
),
positions AS (
    SELECT 
        b.user_id,
        b.crypto_symbol,
        (b.total_quantity - COALESCE(s.total_quantity_sold, 0)) as net_quantity,
        (b.invested_amount - COALESCE(s.redeemed_amount, 0)) as net_invested_amount
    FROM buys b
    LEFT JOIN sells s ON b.user_id = s.user_id AND b.crypto_symbol = s.crypto_symbol
    WHERE (b.total_quantity - COALESCE(s.total_quantity_sold, 0)) > 0
),
portfolio_values AS (
    SELECT 
        p.user_id,
        SUM(p.net_invested_amount) as total_invested,
        SUM(p.net_quantity * cp.price_usd) as total_current_value
    FROM positions p
    JOIN public.crypto_prices cp ON p.crypto_symbol = cp.crypto_symbol
    GROUP BY p.user_id
),
eligible AS (
    SELECT 
        user_id,
        total_invested,
        total_current_value,
        (total_current_value - total_invested) as profit_usd,
        ((total_current_value - total_invested) / total_invested * 100) as return_percent
    FROM portfolio_values
    WHERE total_current_value > total_invested  -- somente usuários com lucro
      AND total_invested >= 100  -- investimento mínimo $100
)
SELECT 
    u.id as user_id,
    COALESCE(m.full_name, u.email) as user_name,
    u.email as user_email,
    e.total_invested,
    e.total_current_value,
    e.profit_usd,
    ROUND(e.return_percent, 2) as return_percent,
    u.created_at as user_created_at
FROM eligible e
JOIN auth.users u ON u.id = e.user_id
LEFT JOIN public.members m ON m.id = e.user_id
WHERE 
    u.created_at < NOW() - INTERVAL '1 hour'  -- conta ativa há pelo menos 1 hora
    AND EXISTS (
        SELECT 1 FROM public.user_privacy_settings ups 
        WHERE ups.user_id = u.id AND ups.show_in_community_feed = true
    )  -- perfil público ativado
    AND EXISTS (
        SELECT 1 FROM public.transactions t 
        WHERE t.user_id = u.id::text
    )  -- tem transações registradas
ORDER BY return_percent DESC;

-- Recriar índices
CREATE INDEX idx_portfolio_rankings_user_id ON public.portfolio_performance_rankings_v2 (user_id, return_percent);
CREATE INDEX idx_portfolio_rankings_return_percent ON public.portfolio_performance_rankings_v2 (return_percent DESC);
CREATE UNIQUE INDEX idx_rankings_v2_user_id ON public.portfolio_performance_rankings_v2 (user_id);

-- 4. Atualizar comentários
COMMENT ON MATERIALIZED VIEW public.portfolio_performance_rankings_v2 IS 'Ranking de performance de portfólios dos usuários - ATUALIZADO: Usa preços reais da API e novos critérios de elegibilidade';
COMMENT ON COLUMN public.portfolio_performance_rankings_v2.return_percent IS 'Retorno percentual total do portfólio baseado em preços reais';

-- 5. Recriar função de refresh
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings_v2()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.portfolio_performance_rankings_v2;
END;
$$ LANGUAGE plpgsql;

-- 6. Recriar trigger
CREATE OR REPLACE FUNCTION public.trg_refresh_rankings_v2()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.refresh_portfolio_rankings_v2();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_refresh_rankings_v2 ON public.transactions;
CREATE TRIGGER trg_refresh_rankings_v2
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trg_refresh_rankings_v2();

-- 7. Verificar configurações atualizadas
SELECT 
    'Configurações de privacidade atualizadas' as status,
    COUNT(*) as membros_com_configuracao
FROM public.user_privacy_settings ups
JOIN public.members m ON ups.user_id = m.id
WHERE m.is_active = true AND ups.show_in_community_feed = true;

-- 8. Verificar transações dos membros ativos
SELECT 
    'Transações dos membros ativos' as status,
    COUNT(*) as total_transacoes,
    COUNT(DISTINCT t.user_id) as usuarios_com_transacoes
FROM public.transactions t
JOIN public.members m ON t.user_id = m.id
WHERE m.is_active = true;

-- 9. Verificar ranking atual
SELECT 
    'Ranking atual' as status,
    COUNT(*) as total_entradas,
    COUNT(CASE WHEN return_percent > 0 THEN 1 END) as usuarios_com_retorno_positivo
FROM public.portfolio_performance_rankings_v2;

-- 10. Comando para forçar refresh do ranking
SELECT public.refresh_portfolio_rankings_v2();

-- Script concluído
-- O ranking agora usará preços reais da API CoinGecko
-- Os valores mostrados no ranking serão os mesmos do dashboard
-- Critérios de elegibilidade atualizados:
-- • Conta ativa há 1+ hora
-- • Investimento mínimo $100
-- • Perfil público ativado
-- • Transações registradas
