-- PARTE 1: Criar tabela de rankings
-- Execute este script primeiro no Supabase SQL Editor

-- Criar tabela de rankings simples
CREATE TABLE IF NOT EXISTS public.portfolio_rankings_simple (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_username TEXT,
    user_created_at TIMESTAMP WITH TIME ZONE,
    time_window TEXT NOT NULL,
    return_percent DECIMAL(10,2) NOT NULL,
    top_asset TEXT,
    top_asset_return DECIMAL(10,2),
    dca_purchase_count INTEGER DEFAULT 0,
    dca_avg_price DECIMAL(15,2),
    total_invested DECIMAL(15,2) NOT NULL,
    total_current_value DECIMAL(15,2) NOT NULL,
    total_unrealized_pnl DECIMAL(15,2) NOT NULL,
    badge TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS
ALTER TABLE public.portfolio_rankings_simple ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso público
DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_rankings_simple;
CREATE POLICY "Allow public read access" ON public.portfolio_rankings_simple
    FOR SELECT USING (true);

-- Verificar se a tabela foi criada
SELECT 'Tabela criada com sucesso!' as status;
