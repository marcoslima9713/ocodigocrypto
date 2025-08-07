-- Script de verificação rápida do ranking
-- Execute este script para verificar se tudo está funcionando

-- 1. Verificar se o usuário Marcos existe
SELECT 
    'Usuário Marcos' as verificação,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Existe'
        ELSE '❌ Não encontrado'
    END as status,
    COUNT(*) as quantidade
FROM public.users 
WHERE id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 2. Verificar configurações de privacidade
SELECT 
    'Configuração de Privacidade' as verificação,
    CASE 
        WHEN show_in_community_feed THEN '✅ Ativada'
        ELSE '❌ Desativada'
    END as status
FROM public.user_privacy_settings 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 3. Verificar transações
SELECT 
    'Transações' as verificação,
    COUNT(*) as total_transações,
    SUM(total_usd) as total_investido,
    COUNT(DISTINCT crypto_symbol) as criptomoedas_diferentes
FROM public.transactions 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';

-- 4. Verificar se a tabela de rankings existe
SELECT 
    'Tabela de Rankings' as verificação,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_rankings_simple') 
        THEN '✅ Existe'
        ELSE '❌ Não existe'
    END as status;

-- 5. Verificar dados no ranking
SELECT 
    'Dados no Ranking' as verificação,
    COUNT(*) as total_rankings,
    COUNT(CASE WHEN user_id = '856d169f-8563-4126-a348-fdedb4f3259f' THEN 1 END) as rankings_marcos
FROM public.portfolio_rankings_simple;

-- 6. Mostrar ranking do usuário Marcos (se existir)
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

-- 7. Mostrar top 5 rankings gerais
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
LIMIT 5;
