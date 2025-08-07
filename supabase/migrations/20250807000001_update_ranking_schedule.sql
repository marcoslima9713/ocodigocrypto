-- ================================================
-- Migration: 2025-08-07 – Atualizar Schedule do Ranking
--            Mudança de tempo real para 5 minutos
-- ================================================
-- Remove trigger de tempo real e configura atualização
-- programada a cada 5 minutos via Edge Function
-- ================================================

-- 1. Remover trigger de tempo real
DROP TRIGGER IF EXISTS trg_refresh_rankings_v2 ON public.transactions;

-- 2. Remover função do trigger (não é mais necessária)
DROP FUNCTION IF EXISTS public.trg_refresh_rankings_v2();

-- 3. Manter apenas a função de refresh manual
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings_v2()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.portfolio_performance_rankings_v2;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar tabela para controlar última atualização
CREATE TABLE IF NOT EXISTS public.ranking_update_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_type TEXT NOT NULL DEFAULT 'scheduled',
    records_updated INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Função para registrar atualizações
CREATE OR REPLACE FUNCTION public.log_ranking_update(
    p_update_type TEXT DEFAULT 'scheduled',
    p_records_updated INTEGER DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.ranking_update_log (
        last_update, 
        update_type, 
        records_updated, 
        execution_time_ms
    ) VALUES (
        NOW(), 
        p_update_type, 
        p_records_updated, 
        p_execution_time_ms
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Função melhorada para refresh com logging
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings_v2_with_log()
RETURNS JSON AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time_ms INTEGER;
    records_count INTEGER;
BEGIN
    start_time := NOW();
    
    -- Fazer o refresh
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.portfolio_performance_rankings_v2;
    
    end_time := NOW();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Contar registros atualizados
    SELECT COUNT(*) INTO records_count FROM public.portfolio_performance_rankings_v2;
    
    -- Registrar a atualização
    PERFORM public.log_ranking_update('scheduled', records_count, execution_time_ms);
    
    RETURN json_build_object(
        'success', true,
        'records_updated', records_count,
        'execution_time_ms', execution_time_ms,
        'last_update', end_time
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Verificar configuração atual
SELECT 
    'Configuração atualizada' as status,
    'Trigger removido - atualização a cada 5 minutos' as descricao;

-- ================================================
-- Fim da migração
-- ================================================
