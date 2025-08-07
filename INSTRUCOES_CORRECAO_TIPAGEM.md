# Correção de Problemas de Tipagem - TEXT vs UUID

## Problema Identificado

O erro `ERROR: 42883: operator does not exist: text = uuid` estava ocorrendo porque:

1. **Tabela `transactions`**: `user_id` foi alterado de UUID para TEXT
2. **Tabela `portfolio_holdings`**: `user_id` foi alterado de UUID para TEXT  
3. **Tabela `community_feed`**: `user_id` é TEXT
4. **Tabela `user_privacy_settings`**: `user_id` é TEXT

Mas algumas funções e views ainda estavam tentando fazer JOIN entre:
- `auth.users.id` (UUID) 
- `public.transactions.user_id` (TEXT)

## Correções Aplicadas

### 1. Função do Community Feed
**Arquivo**: `supabase/migrations/20250808000000_fix_community_feed_function.sql`

**Problema**: A função `insert_community_feed_from_transaction()` estava fazendo:
```sql
LEFT JOIN public.users u ON t.user_id = u.id  -- ERRO: text = uuid
```

**Correção**: 
```sql
LEFT JOIN auth.users u ON t.user_id = u.id::text  -- CORRETO: text = text
```

### 2. View do Portfolio Rankings
**Arquivo**: `supabase/migrations/20250808000001_fix_portfolio_rankings_join.sql`

**Problema**: A view `portfolio_performance_rankings_v2` estava fazendo:
```sql
JOIN auth.users u ON u.id = e.user_id  -- ERRO: uuid = text
LEFT JOIN public.members m ON m.id = e.user_id  -- ERRO: uuid = text
```

**Correção**:
```sql
JOIN auth.users u ON u.id::text = e.user_id  -- CORRETO: text = text
LEFT JOIN public.members m ON m.id::text = e.user_id  -- CORRETO: text = text
```

## Como Aplicar as Correções

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/wvojbjkdlnvlqgjwtdaf)
2. Vá para **SQL Editor**
3. Execute o script: `corrigir_tipagem_supabase_dashboard.sql`

### Opção 2: Via CLI (Se Docker estiver funcionando)

```bash
cd crypto-luxe-portal
supabase db push
```

### Opção 3: Migrações Individuais

Se as migrações automáticas não funcionarem, execute manualmente:

1. **Corrigir Community Feed**:
```sql
-- Execute no SQL Editor do Supabase
DROP FUNCTION IF EXISTS public.insert_community_feed_from_transaction();

CREATE OR REPLACE FUNCTION public.insert_community_feed_from_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.community_feed (
        user_id, user_display_name, user_username, action_type, 
        asset, amount, price, total_value, pnl_percent, pnl_amount
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
        NULL, NULL  -- P&L calculado separadamente
    FROM public.transactions t
    LEFT JOIN auth.users u ON t.user_id = u.id::text
    WHERE t.id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_community_feed
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.insert_community_feed_from_transaction();
```

2. **Corrigir Portfolio Rankings**:
```sql
-- Execute no SQL Editor do Supabase
DROP MATERIALIZED VIEW IF EXISTS public.portfolio_performance_rankings_v2;

CREATE MATERIALIZED VIEW public.portfolio_performance_rankings_v2 AS
-- ... (use o conteúdo completo do arquivo corrigido)
```

## Verificação

Após aplicar as correções, teste com:

```sql
-- Verificar se a função do community_feed funciona
SELECT * FROM public.community_feed LIMIT 5;

-- Verificar se a view do portfolio_rankings funciona  
SELECT COUNT(*) FROM public.portfolio_performance_rankings_v2;

-- Testar inserção de transação
INSERT INTO public.transactions (
    user_id, portfolio_id, crypto_symbol, transaction_type, 
    amount, price_usd, total_usd
) VALUES (
    'test-user-id', 'main', 'BTC', 'buy', 0.1, 45000, 4500
);
```

## Estrutura Final das Tabelas

| Tabela | Campo user_id | Tipo | Observação |
|--------|---------------|------|------------|
| `transactions` | user_id | TEXT | Compatível com auth.users.id::text |
| `portfolio_holdings` | user_id | TEXT | Compatível com auth.users.id::text |
| `community_feed` | user_id | TEXT | Compatível com auth.users.id::text |
| `user_privacy_settings` | user_id | TEXT | Compatível com auth.users.id::text |
| `auth.users` | id | UUID | Convertido para TEXT quando necessário |

## Benefícios da Correção

1. **Consistência**: Todas as tabelas usam TEXT para user_id
2. **Compatibilidade**: Funciona com Firebase UID e Supabase auth
3. **Performance**: Evita conversões desnecessárias
4. **Manutenibilidade**: Código mais limpo e previsível

## Próximos Passos

1. Execute o script de correção no Supabase Dashboard
2. Teste as funcionalidades do community_feed
3. Teste as funcionalidades do portfolio_rankings
4. Verifique se não há outros erros de tipagem
5. Atualize o código frontend se necessário
