# 🔄 Implementação do Sistema de Assinatura Semanal

## 📋 Resumo do Sistema

Este sistema transforma sua plataforma em um modelo de **assinatura semanal**, onde:
- ✅ Clientes pagam e têm acesso por **7 dias**
- ✅ Após 7 dias, o acesso **expira automaticamente**
- ✅ Cliente precisa **renovar o pagamento** para continuar
- ✅ Sistema funciona para **todos os usuários** (novos e existentes)

## 🚀 Passos para Implementação

### 1. **Aplicar Migração no Supabase**

Execute o script SQL no Supabase SQL Editor:

```sql
-- Execute o arquivo: apply-weekly-subscription-migration.sql
\i apply-weekly-subscription-migration.sql
```

### 2. **Deploy da Nova Edge Function**

```bash
# Deploy da função de webhook para assinatura semanal
supabase functions deploy ggcheckout-webhook-weekly
```

### 3. **Atualizar Configuração do GGCheckout**

No painel do GGCheckout, altere a URL do webhook para:
```
https://wvojbjkdlnvlqgjwtdaf.supabase.co/functions/v1/ggcheckout-webhook-weekly
```

### 4. **Atualizar Código Frontend**

Substitua os arquivos no seu projeto:

```bash
# Substituir AuthContext
cp src/contexts/AuthContextWeekly.tsx src/contexts/AuthContext.tsx

# Substituir ProtectedRoute
cp src/components/ProtectedRouteWeekly.tsx src/components/ProtectedRoute.tsx

# Adicionar novos componentes
cp src/components/SubscriptionStatus.tsx src/components/
cp src/components/SubscriptionExpiredModal.tsx src/components/
```

### 5. **Atualizar App.tsx**

Adicione o componente de status da assinatura no dashboard:

```tsx
import { SubscriptionStatus } from "@/components/SubscriptionStatus";

// No Dashboard, adicione:
<SubscriptionStatus />
```

## 🔧 Como Funciona

### **Fluxo de Pagamento:**
1. Cliente faz pagamento → GGCheckout
2. Webhook recebe confirmação → `ggcheckout-webhook-weekly`
3. Sistema cria/renova assinatura → 7 dias de acesso
4. Email automático enviado → Confirmação de renovação
5. Cliente acessa plataforma → Acesso completo por 7 dias

### **Verificação de Expiração:**
- ✅ **Login:** Verifica se assinatura está ativa
- ✅ **Acesso:** Bloqueia conteúdo se expirado
- ✅ **Notificações:** Avisa quando próximo do vencimento
- ✅ **Automático:** Expira assinaturas vencidas

### **Estados do Usuário:**
1. **Membro Ativo:** Assinatura válida → Acesso completo
2. **Membro Expirado:** Assinatura vencida → Acesso bloqueado
3. **Usuário Gratuito:** Sem assinatura → Acesso limitado

## 📊 Estrutura do Banco de Dados

### **Tabela `members` (atualizada):**
```sql
-- Novos campos adicionados:
subscription_start_date    TIMESTAMP  -- Data de início da assinatura
subscription_end_date      TIMESTAMP  -- Data de expiração (7 dias)
subscription_status        TEXT       -- 'active', 'expired', 'cancelled'
subscription_type          TEXT       -- 'weekly'
last_payment_date         TIMESTAMP  -- Último pagamento
payment_count             INTEGER    -- Número de pagamentos
```

### **Nova Tabela `subscription_payments`:**
```sql
-- Histórico de todos os pagamentos
id                        UUID       -- ID único
member_id                 UUID       -- Referência ao membro
transaction_id            TEXT       -- ID da transação
amount                    DECIMAL    -- Valor pago
payment_date              TIMESTAMP  -- Data do pagamento
subscription_start_date   TIMESTAMP  -- Início da assinatura
subscription_end_date     TIMESTAMP  -- Fim da assinatura
status                    TEXT       -- 'completed', 'failed', etc.
```

## 🎯 Funcionalidades Implementadas

### **1. Verificação Automática de Expiração**
```sql
-- Função que expira assinaturas automaticamente
SELECT public.check_and_expire_subscriptions();
```

### **2. Criação/Renovação de Assinatura**
```sql
-- Função para criar ou renovar assinatura semanal
SELECT public.create_weekly_subscription(
    member_id,
    transaction_id,
    amount,
    payment_method
);
```

### **3. Verificação de Status**
```sql
-- Verificar se usuário tem assinatura ativa
SELECT public.user_has_active_subscription(user_id);
```

## 🔔 Notificações do Sistema

### **Para Usuários:**
- ⚠️ **2 dias antes:** "Assinatura expirando em breve"
- ❌ **Expirada:** "Assinatura expirada - Renove para continuar"
- ✅ **Renovada:** "Assinatura renovada com sucesso"

### **Para Administradores:**
- 📊 **Relatórios:** Histórico de pagamentos
- 📈 **Métricas:** Taxa de renovação
- 🔍 **Monitoramento:** Assinaturas próximas do vencimento

## 🛡️ Segurança

### **Row Level Security (RLS):**
- ✅ Usuários só veem seus próprios dados
- ✅ Histórico de pagamentos protegido
- ✅ Verificação de assinatura no servidor

### **Validação de Webhook:**
- ✅ Assinatura HMAC obrigatória
- ✅ Validação de payload
- ✅ Log de todas as transações

## 📱 Interface do Usuário

### **Componente `SubscriptionStatus`:**
- 📅 Mostra data de expiração
- ⏰ Contador de dias restantes
- 🔄 Botão de renovação
- ⚠️ Avisos de expiração

### **Modal `SubscriptionExpiredModal`:**
- ❌ Aviso de assinatura expirada
- 💎 Benefícios da renovação
- 🔄 Botão direto para pagamento

### **Tela de Bloqueio:**
- 🔒 Conteúdo premium bloqueado
- 💎 Call-to-action para assinatura
- 📋 Lista de benefícios

## 🧪 Testes

### **1. Testar Migração:**
```sql
-- Verificar se campos foram adicionados
SELECT * FROM public.members LIMIT 1;

-- Verificar se funções foram criadas
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%subscription%';
```

### **2. Testar Webhook:**
```bash
# Testar webhook localmente
curl -X POST http://localhost:54321/functions/v1/ggcheckout-webhook-weekly \
  -H "Authorization: Bearer SEU_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event":"pagamento_aprovado","customer":{"email":"test@test.com","name":"Test User"}}'
```

### **3. Testar Expiração:**
```sql
-- Simular expiração (apenas para teste)
UPDATE public.members 
SET subscription_end_date = now() - INTERVAL '1 day'
WHERE email = 'seu-email@teste.com';

-- Verificar se expirou
SELECT public.is_subscription_active(id) FROM public.members 
WHERE email = 'seu-email@teste.com';
```

## 🚨 Importante

### **Antes de Implementar:**
1. ✅ **Backup:** Faça backup do banco de dados
2. ✅ **Teste:** Teste em ambiente de desenvolvimento
3. ✅ **Comunicação:** Informe usuários sobre a mudança
4. ✅ **Suporte:** Prepare equipe para dúvidas

### **Após Implementar:**
1. ✅ **Monitoramento:** Acompanhe logs de webhook
2. ✅ **Suporte:** Atenda usuários com problemas
3. ✅ **Métricas:** Analise taxa de renovação
4. ✅ **Otimização:** Ajuste baseado no feedback

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs do Supabase
2. Confirme configuração do webhook
3. Teste funções SQL manualmente
4. Verifique políticas RLS

---

**🎉 Parabéns! Seu sistema de assinatura semanal está pronto para gerar receita recorrente!**
