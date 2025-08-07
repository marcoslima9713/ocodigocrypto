-- Evitar erro de refresh concurrently ao inserir transações

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_refresh_rankings_v2 ON public.transactions;
DROP FUNCTION IF EXISTS public.trg_refresh_rankings_v2();

-- Função simples sem CONCURRENTLY (execução síncrona e mais segura em alto volume de inserts)
CREATE OR REPLACE FUNCTION public.trg_refresh_rankings_v2()
RETURNS trigger AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW public.portfolio_performance_rankings_v2;
  EXCEPTION WHEN OTHERS THEN
    -- Evita quebrar a transação de insert; log básico (pode ser melhorado com tabela de logs)
    RAISE NOTICE 'Falha ao atualizar MV de rankings: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger por statement (menos frequente)
CREATE TRIGGER trg_refresh_rankings_v2
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH STATEMENT EXECUTE FUNCTION public.trg_refresh_rankings_v2();
