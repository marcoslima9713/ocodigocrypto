-- Corrigir estrutura da tabela transactions
-- Execute este script para remover a coluna portfolio_id desnecessária

-- 1. Verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Remover a coluna portfolio_id se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'portfolio_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.transactions DROP COLUMN portfolio_id;
        RAISE NOTICE 'Coluna portfolio_id removida com sucesso';
    ELSE
        RAISE NOTICE 'Coluna portfolio_id não existe';
    END IF;
END $$;

-- 3. Verificar se a tabela está correta agora
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se as transações ainda existem
SELECT 
    COUNT(*) as total_transações,
    SUM(total_usd) as total_investido
FROM public.transactions 
WHERE user_id = '856d169f-8563-4126-a348-fdedb4f3259f';
