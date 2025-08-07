-- Script de teste rápido para verificar o ranking
-- Execute este script após o script principal

-- 1. Verificar se a tabela existe
SELECT 
    'Tabela portfolio_rankings_simple' as verificação,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_rankings_simple') 
        THEN '✅ Existe'
        ELSE '❌ Não existe'
    END as status;

-- 2. Verificar se há dados na tabela
SELECT 
    'Dados na tabela' as verificação,
    COUNT(*) as total_registros
FROM public.portfolio_rankings_simple;

-- 3. Verificar se o usuário Marcos está no ranking
SELECT 
    'Usuário Marcos no ranking' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Aparece'
        ELSE '❌ Não aparece'
    END as status,
    COUNT(*) as quantidade
FROM public.portfolio_rankings_simple 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 4. Mostrar dados do usuário Marcos
SELECT 
    user_name,
    user_username,
    time_window,
    return_percent,
    top_asset,
    top_asset_return,
    dca_purchase_count,
    total_invested,
    total_current_value,
    badge
FROM public.portfolio_rankings_simple 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f'
ORDER BY time_window;

-- 5. Mostrar top 3 rankings
SELECT 
    user_name,
    user_username,
    time_window,
    return_percent,
    top_asset,
    dca_purchase_count,
    total_invested,
    badge
FROM public.portfolio_rankings_simple 
ORDER BY return_percent DESC, time_window
LIMIT 3;

-- 6. Verificar transações do usuário Marcos
SELECT 
    'Transações do usuário' as verificação,
    COUNT(*) as total_transações,
    SUM(total_usd) as total_investido,
    COUNT(DISTINCT crypto_symbol) as criptomoedas_diferentes
FROM public.transactions 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 7. Verificar configurações de privacidade
SELECT 
    'Configuração de privacidade' as verificação,
    CASE 
        WHEN show_in_community_feed THEN '✅ Ativada'
        ELSE '❌ Desativada'
    END as status
FROM public.user_privacy_settings 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';
