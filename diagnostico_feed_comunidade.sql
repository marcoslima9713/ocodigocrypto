-- ================================================
-- Diagnóstico: Feed da Comunidade
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

-- 4. Verificar transações do usuário marcoslima9713@gmail.com
SELECT 
    'Transações do usuário' as verificação,
    COUNT(*) as total_transacoes,
    STRING_AGG(DISTINCT transaction_type, ', ') as tipos_transacao,
    STRING_AGG(DISTINCT crypto_symbol, ', ') as ativos
FROM public.transactions 
WHERE user_id IN (
    SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
);

-- 5. Verificar configurações de privacidade do usuário
SELECT 
    'Configurações de privacidade' as verificação,
    ups.show_in_community_feed,
    ups.created_at,
    ups.updated_at
FROM public.user_privacy_settings ups
JOIN auth.users u ON ups.user_id = u.id::text
WHERE u.email = 'marcoslima9713@gmail.com';

-- 6. Verificar se há entradas no community_feed para o usuário
SELECT 
    'Entradas no community_feed' as verificação,
    COUNT(*) as total_entradas,
    STRING_AGG(DISTINCT action_type, ', ') as tipos_acao,
    STRING_AGG(DISTINCT asset, ', ') as ativos
FROM public.community_feed 
WHERE user_id IN (
    SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'
);

-- 7. Verificar estrutura da tabela community_feed
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'community_feed'
ORDER BY ordinal_position;

-- 8. Verificar estrutura da tabela user_privacy_settings
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_privacy_settings'
ORDER BY ordinal_position;

-- 9. Testar inserção manual no community_feed
-- (Comentado para não inserir dados de teste)
/*
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
    (SELECT id::text FROM auth.users WHERE email = 'marcoslima9713@gmail.com'),
    'Marcos Lima',
    'marcoslima9713',
    'buy',
    'BTC',
    1.0,
    114700.00,
    114700.00,
    NULL,
    NULL
);
*/

-- 10. Verificar se o trigger está funcionando
-- Simular uma transação para testar o trigger
SELECT 
    'Teste do trigger' as verificação,
    'Para testar, insira uma nova transação e verifique se aparece no community_feed' as instrucao;

-- ================================================
-- Correções necessárias
-- ================================================

-- Se a tabela community_feed não existir, criar:
/*
CREATE TABLE public.community_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_display_name TEXT NOT NULL,
    user_username TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('buy', 'sell', 'add')),
    asset TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    price NUMERIC NOT NULL CHECK (price >= 0),
    total_value NUMERIC NOT NULL CHECK (total_value >= 0),
    pnl_percent NUMERIC,
    pnl_amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_asset CHECK (asset ~ '^[A-Z]{2,10}$')
);

CREATE INDEX idx_community_feed_created_at ON public.community_feed (created_at DESC);
CREATE INDEX idx_community_feed_user_id ON public.community_feed (user_id);
CREATE INDEX idx_community_feed_action_type ON public.community_feed (action_type);
CREATE INDEX idx_community_feed_asset ON public.community_feed (asset);
*/

-- Se a tabela user_privacy_settings não existir, criar:
/*
CREATE TABLE public.user_privacy_settings (
    user_id TEXT PRIMARY KEY,
    show_in_community_feed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_user_privacy_settings_user_id ON public.user_privacy_settings (user_id);
*/

-- Se o trigger não existir, criar:
/*
CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
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
    )
    SELECT 
        t.user_id,
        COALESCE(m.full_name, 'Usuário Anônimo'),
        u.email,
        t.transaction_type,
        t.crypto_symbol,
        t.amount,
        t.price_usd,
        t.total_usd,
        NULL,
        NULL
    FROM public.transactions t
    LEFT JOIN auth.users u ON t.user_id = u.id::text
    LEFT JOIN public.members m ON m.id = u.id
    WHERE t.id = NEW.id
    AND EXISTS (
        SELECT 1 FROM public.user_privacy_settings ups
        WHERE ups.user_id = t.user_id
        AND ups.show_in_community_feed = true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_community_feed
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_community_feed_from_transaction();
*/

-- ================================================
-- Fim do diagnóstico
-- ================================================
