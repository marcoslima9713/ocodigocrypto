-- ================================================
-- Correção Ultra Simples: Feed da Comunidade
-- Versão que evita completamente problemas de tipo
-- ================================================

-- 1. Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS public.community_feed (
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

CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id TEXT PRIMARY KEY,
    show_in_community_feed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_community_feed_created_at ON public.community_feed (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_feed_user_id ON public.community_feed (user_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_action_type ON public.community_feed (action_type);
CREATE INDEX IF NOT EXISTS idx_community_feed_asset ON public.community_feed (asset);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON public.user_privacy_settings (user_id);

-- 3. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_insert_community_feed ON public.transactions;
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();

-- 4. Criar função ultra simplificada
CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir no feed apenas se o usuário tiver perfil público
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
        COALESCE(m.full_name, u.email, 'Usuário Anônimo'),
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

-- 5. Criar trigger
CREATE TRIGGER trigger_insert_community_feed
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_community_feed_from_transaction();

-- 6. Garantir que todos os usuários tenham configurações de privacidade
INSERT INTO public.user_privacy_settings (user_id, show_in_community_feed)
SELECT 
    u.id::text as user_id,
    true as show_in_community_feed
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups 
    WHERE ups.user_id = u.id::text
);

-- 7. Inserir transações existentes no community_feed (versão ultra simplificada)
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
    pnl_amount,
    created_at
)
SELECT 
    t.user_id,
    COALESCE(m.full_name, u.email, 'Usuário Anônimo'),
    u.email,
    t.transaction_type,
    t.crypto_symbol,
    t.amount,
    t.price_usd,
    t.total_usd,
    NULL,
    NULL,
    t.transaction_date
FROM public.transactions t
LEFT JOIN auth.users u ON t.user_id = u.id::text
LEFT JOIN public.members m ON m.id = u.id
WHERE EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups
    WHERE ups.user_id = t.user_id
    AND ups.show_in_community_feed = true
)
AND NOT EXISTS (
    SELECT 1 FROM public.community_feed cf
    WHERE cf.user_id = t.user_id
    AND cf.asset = t.crypto_symbol
    AND cf.action_type = t.transaction_type
    AND cf.amount = t.amount
    AND cf.price = t.price_usd
    AND cf.total_value = t.total_usd
);

-- 8. Verificar resultado
SELECT 
    'Feed da Comunidade' as verificação,
    COUNT(*) as total_entradas,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    STRING_AGG(DISTINCT action_type, ', ') as tipos_acao
FROM public.community_feed;

-- 9. Verificar configurações de privacidade
SELECT 
    'Configurações de Privacidade' as verificação,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN show_in_community_feed THEN 1 END) as usuarios_publicos,
    COUNT(CASE WHEN NOT show_in_community_feed THEN 1 END) as usuarios_privados
FROM public.user_privacy_settings;

-- 10. Verificar especificamente o usuário marcoslima9713@gmail.com
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

-- ================================================
-- Fim da correção ultra simples
-- ================================================
