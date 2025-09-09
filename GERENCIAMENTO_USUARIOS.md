# 👥 Sistema de Gerenciamento de Usuários

## 📋 Visão Geral

O sistema de gerenciamento de usuários foi implementado no painel administrativo para permitir o controle completo dos usuários e suas assinaturas semanais. Esta funcionalidade está disponível na aba **"Gerenciar Usuários"** do painel administrativo.

## 🚀 Funcionalidades Implementadas

### 📊 Dashboard de Estatísticas
- **Total de Usuários**: Número total de usuários cadastrados
- **Assinantes Ativos**: Usuários com assinatura ativa e válida
- **Assinaturas Expiradas**: Usuários com assinatura vencida
- **Receita Total**: Soma de todos os pagamentos realizados
- **Alertas**: Notificações sobre assinaturas expirando

### 👤 Gerenciamento de Usuários
- **Visualizar Lista**: Tabela completa com todos os usuários
- **Busca e Filtros**: Pesquisar por email/nome e filtrar por status
- **Adicionar Usuário**: Criar novos usuários manualmente
- **Remover Usuário**: Excluir usuários do sistema
- **Atualizar Assinatura**: Estender período de assinatura
- **Exportar Dados**: Baixar lista de usuários em CSV

### 💰 Histórico de Pagamentos
- **Visualizar Pagamentos**: Histórico completo por usuário
- **Detalhes da Transação**: Valor, data, método e status
- **Últimos Pagamentos**: Informações na lista principal

### ⏰ Controle de Assinaturas
- **Status em Tempo Real**: Ativo, Expirado, Cancelado
- **Dias Restantes**: Contagem regressiva automática
- **Renovação Manual**: Estender assinaturas manualmente
- **Alertas de Vencimento**: Notificações automáticas

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### `weekly_subscriptions`
```sql
- id (UUID): Identificador único
- user_id (UUID): Referência ao usuário
- email (TEXT): Email do usuário
- full_name (TEXT): Nome completo
- subscription_status (TEXT): Status da assinatura
- start_date (TIMESTAMP): Data de início
- end_date (TIMESTAMP): Data de expiração
- auto_renew (BOOLEAN): Renovação automática
- created_at/updated_at (TIMESTAMP): Controle de data
```

#### `subscription_payments`
```sql
- id (UUID): Identificador único
- user_id (UUID): Referência ao usuário
- subscription_id (UUID): Referência à assinatura
- amount (DECIMAL): Valor do pagamento
- currency (TEXT): Moeda (BRL)
- payment_method (TEXT): Método de pagamento
- payment_date (TIMESTAMP): Data do pagamento
- transaction_id (TEXT): ID da transação
- ggcheckout_transaction_id (TEXT): ID do GGCheckout
- status (TEXT): Status do pagamento
- created_at (TIMESTAMP): Data de criação
```

### Políticas de Segurança (RLS)
- Usuários podem ver apenas seus próprios dados
- Service role tem acesso completo para administração
- Políticas de segurança ativadas em todas as tabelas

## 🔧 Como Usar

### Acessar o Painel
1. Faça login como administrador
2. Acesse `/admin`
3. Clique na aba **"Gerenciar Usuários"**

### Adicionar Novo Usuário
1. Clique em **"Adicionar Usuário"**
2. Preencha os dados obrigatórios:
   - Email
   - Nome completo
   - Senha temporária
   - Dias de assinatura
3. Clique em **"Criar Usuário"**

### Visualizar Detalhes do Usuário
1. Clique no ícone de **olho** (👁️) na linha do usuário
2. Visualize as abas:
   - **Informações**: Dados básicos do usuário
   - **Pagamentos**: Histórico completo de transações
   - **Ações**: Operações administrativas

### Estender Assinatura
1. Na lista de usuários, clique no ícone de **edição** (✏️)
2. Selecione o período desejado (+7d, +14d, +30d)
3. A assinatura será automaticamente atualizada

### Remover Usuário
1. Clique no ícone de **lixeira** (🗑️) na linha do usuário
2. Confirme a ação no diálogo
3. **Atenção**: Esta ação é irreversível!

### Exportar Dados
1. Use os filtros para selecionar os usuários desejados
2. Clique em **"Exportar CSV"**
3. O arquivo será baixado automaticamente

## 📈 Funcionalidades Automáticas

### Expiração de Assinaturas
- Função automática para marcar assinaturas expiradas
- Execução via `check_and_expire_subscriptions()`
- Atualização em tempo real do status

### Cálculo de Dias Restantes
- Calculado automaticamente com base na data de expiração
- Atualizado em tempo real na interface
- Alertas automáticos para vencimentos próximos

### Integração com Sistema de Autenticação
- Sincronização com tabela `auth.users` do Supabase
- Integração com tabela `members` existente
- Manutenção de consistência entre sistemas

## ⚠️ Considerações Importantes

### Segurança
- Todas as operações são logadas
- Políticas RLS ativas para proteção de dados
- Validação de permissões administrativas

### Performance
- Índices otimizados para consultas frequentes
- Paginação automática para grandes volumes
- Cache de estatísticas para melhor performance

### Backup e Recuperação
- Dados protegidos por políticas de backup do Supabase
- Triggers para auditoria de mudanças
- Histórico completo de transações preservado

## 🛠️ Manutenção

### Limpeza Periódica
```sql
-- Limpar logs antigos (executar mensalmente)
DELETE FROM webhook_logs WHERE created_at < now() - INTERVAL '3 months';
```

### Verificação de Integridade
```sql
-- Verificar usuários sem assinatura
SELECT u.email FROM auth.users u 
LEFT JOIN weekly_subscriptions ws ON u.id = ws.user_id 
WHERE ws.user_id IS NULL;
```

### Estatísticas de Uso
```sql
-- Relatório mensal de receita
SELECT 
    DATE_TRUNC('month', payment_date) as mes,
    COUNT(*) as total_pagamentos,
    SUM(amount) as receita_total
FROM subscription_payments 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY mes DESC;
```

## 📞 Suporte

Para dúvidas ou problemas com o sistema de gerenciamento de usuários:

1. Verifique os logs do Supabase
2. Consulte a documentação das APIs
3. Verifique as políticas RLS
4. Entre em contato com o suporte técnico

---

**Versão**: 1.0  
**Última Atualização**: Janeiro 2025  
**Desenvolvido por**: Sistema Academia Premium
