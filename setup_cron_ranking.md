# 🕐 Configuração do Cron Job para Ranking (5 minutos)

## 📋 Visão Geral

O ranking agora é atualizado a cada **5 minutos** em vez de tempo real, melhorando a performance e reduzindo a carga no banco de dados.

## 🔧 Configuração

### 1. **Deploy da Edge Function**

```bash
# No terminal, na pasta do projeto
cd crypto-luxe-portal
supabase functions deploy update-crypto-prices
```

### 2. **Configurar Cron Job**

#### **Opção A: Cron Job Online (Recomendado)**

1. Acesse [cron-job.org](https://cron-job.org)
2. Crie uma conta gratuita
3. Adicione novo cron job:
   - **URL**: `https://seu-projeto.supabase.co/functions/v1/update-crypto-prices`
   - **Schedule**: `*/5 * * * *` (a cada 5 minutos)
   - **Method**: `POST`

#### **Opção B: Vercel Cron (Se usar Vercel)**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/update-ranking",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### **Opção C: GitHub Actions**

```yaml
# .github/workflows/update-ranking.yml
name: Update Ranking
on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  update-ranking:
    runs-on: ubuntu-latest
    steps:
      - name: Update Crypto Prices and Ranking
        run: |
          curl -X POST https://seu-projeto.supabase.co/functions/v1/update-crypto-prices
```

### 3. **Verificar Configuração**

Execute no **Supabase SQL Editor**:

```sql
-- Verificar se o trigger foi removido
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trg_refresh_rankings_v2';

-- Verificar última atualização
SELECT 
    last_update,
    update_type,
    records_updated,
    execution_time_ms
FROM public.ranking_update_log
ORDER BY last_update DESC
LIMIT 5;
```

## 📊 Monitoramento

### **1. Logs de Atualização**

```sql
-- Verificar histórico de atualizações
SELECT 
    last_update,
    update_type,
    records_updated,
    execution_time_ms,
    CASE 
        WHEN execution_time_ms > 5000 THEN '⚠️ LENTO'
        WHEN execution_time_ms > 2000 THEN '⚡ NORMAL'
        ELSE '🚀 RÁPIDO'
    END as performance
FROM public.ranking_update_log
ORDER BY last_update DESC
LIMIT 10;
```

### **2. Status do Ranking**

```sql
-- Verificar se ranking está atualizado
SELECT 
    COUNT(*) as total_usuarios,
    MAX(created_at) as ultima_atualizacao,
    CASE 
        WHEN MAX(created_at) < NOW() - INTERVAL '10 minutes' 
        THEN '⚠️ DESATUALIZADO'
        ELSE '✅ ATUALIZADO'
    END as status
FROM public.portfolio_performance_rankings_v2;
```

## ⚡ Benefícios da Mudança

### **✅ Performance Melhorada**
- **Menos carga no banco**: Sem trigger a cada transação
- **Consultas mais rápidas**: Materialized view otimizada
- **Melhor escalabilidade**: Suporta mais usuários

### **✅ Consistência**
- **Preços atualizados**: A cada 5 minutos da API CoinGecko
- **Ranking sincronizado**: Mesmo algoritmo do dashboard
- **Logs detalhados**: Monitoramento completo

### **✅ Confiabilidade**
- **Menos falhas**: Sem trigger em cascata
- **Recuperação automática**: Se falhar, tenta novamente em 5 min
- **Backup de logs**: Histórico completo de atualizações

## 🔍 Troubleshooting

### **Problema: Ranking não atualiza**
```sql
-- Verificar se Edge Function está funcionando
SELECT * FROM public.ranking_update_log 
ORDER BY last_update DESC 
LIMIT 1;
```

### **Problema: Preços desatualizados**
```sql
-- Verificar preços atuais
SELECT 
    crypto_symbol,
    price_usd,
    updated_at,
    NOW() - updated_at as tempo_desatualizado
FROM public.crypto_prices
WHERE updated_at < NOW() - INTERVAL '10 minutes';
```

### **Problema: Performance lenta**
```sql
-- Verificar tempo de execução
SELECT 
    AVG(execution_time_ms) as tempo_medio_ms,
    MAX(execution_time_ms) as tempo_max_ms,
    COUNT(*) as total_execucoes
FROM public.ranking_update_log
WHERE last_update > NOW() - INTERVAL '1 hour';
```

## 🎯 Resultado Final

- **⏰ Atualização**: A cada 5 minutos
- **📊 Performance**: Melhorada significativamente
- **🔍 Monitoramento**: Logs detalhados
- **⚡ Confiabilidade**: Sistema mais estável
- **📈 Escalabilidade**: Suporta crescimento

O ranking agora é mais eficiente e confiável! 🚀
