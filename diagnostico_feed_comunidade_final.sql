-- ================================================
-- Diagnóstico: Feed da Comunidade (VERSÃO FINAL)
-- Verificar por que o usuário não aparece no feed
-- ================================================

-- 1. Verificar se a tabela community_feed existe
SELECT 
    'Tabela community_feed' as verificação,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_feed') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status;

-- 2. Verificar se a tabela user_privacy_settings existe
SELECT 
    'Tabela user_privacy_settings' as verificação,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_privacy_settings') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status;

-- 3. Verificar se o trigger existe
SELECT 
    'Trigger community_feed' as verificação,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_insert_community_feed'
        ) 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as status;

-- 4. Verificar se o usuário existe em auth.users
SELECT 
    'Usuário em auth.users' as verificação,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'marcoslima9713@gmail.com';

-- 5. Verificar transações do usuário marcoslima9713@gmail.com
SELECT 
    'Transações do usuário' as verificação,
    COUNT(*) as total_transacoes,
    STRING_AGG(DISTINCT transaction_type, ', ') as tipos_transacao,
    STRING_AGG(DISTINCT crypto_symbol, ', ') as ativos
FROM public.transactions 
WHERE user_id IN (
    SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
);

-- 6. Verificar configurações de privacidade do usuário (CORRIGIDO)
SELECT 
    'Configurações de privacidade' as verificação,
    ups.show_in_community_feed,
    ups.created_at,
    ups.updated_at
FROM public.user_privacy_settings ups
WHERE ups.user_id IN (
    SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
);

-- 7. Verificar se há entradas no community_feed para o usuário
SELECT 
    'Entradas no community_feed' as verificação,
    COUNT(*) as total_entradas,
    STRING_AGG(DISTINCT action_type, ', ') as tipos_acao,
    STRING_AGG(DISTINCT asset, ', ') as ativos
FROM public.community_feed 
WHERE user_id IN (
    SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
);

-- 8. Verificar estrutura da tabela community_feed
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'community_feed'
ORDER BY ordinal_position;

-- 9. Verificar estrutura da tabela user_privacy_settings
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_privacy_settings'
ORDER BY ordinal_position;

-- 10. Verificar todas as configurações de privacidade
SELECT 
    'Todas as configurações de privacidade' as verificação,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN show_in_community_feed THEN 1 END) as usuarios_publicos,
    COUNT(CASE WHEN NOT show_in_community_feed THEN 1 END) as usuarios_privados
FROM public.user_privacy_settings;

-- 11. Verificar todas as entradas no community_feed
SELECT 
    'Todas as entradas no community_feed' as verificação,
    COUNT(*) as total_entradas,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    STRING_AGG(DISTINCT action_type, ', ') as tipos_acao
FROM public.community_feed;

-- 12. Verificar especificamente o usuário marcoslima9713@gmail.com (CORRIGIDO)
SELECT 
    'Usuário específico' as verificação,
    u.email,
    ups.show_in_community_feed,
    COUNT(t.id) as total_transacoes,
    COUNT(cf.id) as entradas_no_feed
FROM auth.users u
LEFT JOIN public.user_privacy_settings ups ON ups.user_id = u.id::text
LEFT JOIN public.transactions t ON t.user_id = u.id::text
LEFT JOIN public.community_feed cf ON cf.user_id = u.id::text
WHERE u.email = 'marcoslima9713@gmail.com'
GROUP BY u.email, ups.show_in_community_feed;

-- 13. Verificar se há dados de teste
SELECT 
    'Dados de teste' as verificação,
    'Para testar, insira uma nova transação e verifique se aparece no community_feed' as instrucao;

-- ================================================
-- Fim do diagnóstico final
-- ================================================
