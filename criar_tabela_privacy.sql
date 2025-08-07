-- Script para criar a tabela user_privacy_settings
-- Esta tabela é necessária para o ranking funcionar

-- 1. Criar a tabela user_privacy_settings
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    show_in_community_feed BOOLEAN DEFAULT true,
    show_portfolio_value BOOLEAN DEFAULT true,
    show_transactions BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança
CREATE POLICY "Users can view their own privacy settings" 
ON public.user_privacy_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" 
ON public.user_privacy_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" 
ON public.user_privacy_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Criar configurações para todos os usuários existentes
INSERT INTO public.user_privacy_settings (user_id, show_in_community_feed, show_portfolio_value, show_transactions)
SELECT 
    u.id,
    true,  -- mostrar no ranking por padrão
    true,  -- mostrar valor do portfólio
    true   -- mostrar transações
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_privacy_settings ups 
    WHERE ups.user_id = u.id
);

-- 5. Verificar se foi criado corretamente
SELECT 
    'Tabela criada com sucesso' as status,
    COUNT(*) as total_configuracoes
FROM public.user_privacy_settings;

-- 6. Verificar configurações do usuário específico
SELECT 
    'Configuração do usuário' as status,
    ups.user_id,
    ups.show_in_community_feed,
    ups.show_portfolio_value,
    ups.show_transactions,
    u.email
FROM public.user_privacy_settings ups
JOIN auth.users u ON u.id = ups.user_id
WHERE u.email = 'marcoslima9713@gmail.com';
