-- Criação da tabela community_feed para armazenar atividades da comunidade
CREATE TABLE public.community_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Usando TEXT para compatibilidade com Firebase UID
    user_display_name TEXT NOT NULL, -- Nome de exibição do usuário
    user_username TEXT, -- Username opcional (ex: @carlos_silva)
    action_type TEXT NOT NULL CHECK (action_type IN ('buy', 'sell', 'add')),
    asset TEXT NOT NULL, -- ex: 'BTC', 'ETH', 'LINK'
    amount NUMERIC NOT NULL CHECK (amount > 0),
    price NUMERIC NOT NULL CHECK (price >= 0),
    total_value NUMERIC NOT NULL CHECK (total_value >= 0), -- amount * price
    pnl_percent NUMERIC, -- percentual de lucro/prejuízo, pode ser NULL
    pnl_amount NUMERIC, -- valor absoluto do lucro/prejuízo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_asset CHECK (asset ~ '^[A-Z]{2,10}$') -- valida ativos com 2-10 letras maiúsculas
);

-- Índices para otimização de performance
CREATE INDEX idx_community_feed_created_at ON public.community_feed (created_at DESC);
CREATE INDEX idx_community_feed_user_id ON public.community_feed (user_id);
CREATE INDEX idx_community_feed_action_type ON public.community_feed (action_type);
CREATE INDEX idx_community_feed_asset ON public.community_feed (asset);

-- Comentários para documentação
COMMENT ON TABLE public.community_feed IS 'Feed de atividades da comunidade para exibir ações públicas dos usuários';
COMMENT ON COLUMN public.community_feed.user_display_name IS 'Nome de exibição do usuário (ex: Carlos Silva)';
COMMENT ON COLUMN public.community_feed.user_username IS 'Username opcional do usuário (ex: @carlos_silva)';
COMMENT ON COLUMN public.community_feed.action_type IS 'Tipo de ação: buy (compra), sell (venda), add (adição)';
COMMENT ON COLUMN public.community_feed.asset IS 'Símbolo do ativo (ex: BTC, ETH, LINK)';
COMMENT ON COLUMN public.community_feed.amount IS 'Quantidade do ativo';
COMMENT ON COLUMN public.community_feed.price IS 'Preço unitário do ativo';
COMMENT ON COLUMN public.community_feed.total_value IS 'Valor total da transação (amount * price)';
COMMENT ON COLUMN public.community_feed.pnl_percent IS 'Percentual de lucro/prejuízo';
COMMENT ON COLUMN public.community_feed.pnl_amount IS 'Valor absoluto do lucro/prejuízo';

-- Função para inserir automaticamente no feed quando uma transação é criada
CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir no feed apenas se for uma transação pública (não privada)
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
        COALESCE(u.display_name, 'Usuário Anônimo'),
        u.username,
        t.transaction_type,
        t.crypto_symbol,
        t.amount,
        t.price_usd,
        t.total_usd,
        -- Calcular P&L se for uma venda
        CASE 
            WHEN t.transaction_type = 'sell' THEN
                (t.price_usd - (
                    SELECT AVG(price_usd) 
                    FROM public.transactions 
                    WHERE user_id = t.user_id 
                    AND crypto_symbol = t.crypto_symbol 
                    AND transaction_type = 'buy'
                    AND transaction_date < t.transaction_date
                )) / (
                    SELECT AVG(price_usd) 
                    FROM public.transactions 
                    WHERE user_id = t.user_id 
                    AND crypto_symbol = t.crypto_symbol 
                    AND transaction_type = 'buy'
                    AND transaction_date < t.transaction_date
                ) * 100
            ELSE NULL
        END,
        CASE 
            WHEN t.transaction_type = 'sell' THEN
                (t.price_usd - (
                    SELECT AVG(price_usd) 
                    FROM public.transactions 
                    WHERE user_id = t.user_id 
                    AND crypto_symbol = t.crypto_symbol 
                    AND transaction_type = 'buy'
                    AND transaction_date < t.transaction_date
                )) * t.amount
            ELSE NULL
        END
    FROM public.transactions t
    LEFT JOIN public.users u ON t.user_id = u.id
    WHERE t.id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para inserir automaticamente no feed
CREATE TRIGGER trigger_insert_community_feed
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_community_feed_from_transaction();

-- Tabela de configurações de privacidade dos usuários
CREATE TABLE public.user_privacy_settings (
    user_id TEXT PRIMARY KEY,
    show_in_community_feed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para configurações de privacidade
CREATE INDEX idx_user_privacy_settings_user_id ON public.user_privacy_settings (user_id);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_user_privacy_settings_updated_at
    BEFORE UPDATE ON public.user_privacy_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 