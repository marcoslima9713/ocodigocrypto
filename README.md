# Sistema de Integração GGCheckout

Este sistema integra sua área de membros com a GGCheckout através de webhooks, criando automaticamente usuários e enviando e-mails de boas-vindas quando um pagamento é aprovado.

## 🚀 Funcionalidades

- ✅ Endpoint de webhook seguro para GGCheckout (`/ggcheckout-webhook`)
- ✅ Validação de assinatura do webhook para segurança
- ✅ Criação automática de usuários no banco de dados
- ✅ Geração de senhas seguras e criptografadas
- ✅ Envio automático de e-mails com dados de acesso
- ✅ Template de e-mail responsivo e profissional
- ✅ Sistema de logs para monitoramento
- ✅ Prevenção de duplicatas por transaction_id

## 🏗️ Arquitetura

O sistema utiliza:
- **Supabase Edge Functions** para o backend serverless
- **Supabase Database** para armazenamento de dados
- **Resend** para envio de e-mails transacionais
- **PostgreSQL** com Row Level Security (RLS)
- **Validação HMAC SHA-256** para segurança dos webhooks

## 📊 Estrutura do Banco de Dados

### Tabela `members`
- `id` (UUID) - Identificador único
- `email` (TEXT) - E-mail do cliente
- `password_hash` (TEXT) - Senha criptografada
- `full_name` (TEXT) - Nome completo
- `product_name` (TEXT) - Nome do produto comprado
- `ggcheckout_transaction_id` (TEXT) - ID da transação GGCheckout
- `is_active` (BOOLEAN) - Status ativo/inativo
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### Tabela `webhook_logs`
- `id` (UUID) - Identificador único
- `webhook_type` (TEXT) - Tipo do webhook
- `payload` (JSONB) - Dados recebidos
- `status` (TEXT) - Status do processamento
- `error_message` (TEXT) - Mensagem de erro (se houver)
- `created_at` (TIMESTAMP) - Data do log

## 🔗 URL do Webhook

Configure este endpoint na GGCheckout:

```
https://wvojbjkdlnvlqgjwtdaf.supabase.co/functions/v1/ggcheckout-webhook
```

## ⚙️ Configuração na GGCheckout

1. **Acesse sua conta GGCheckout**
2. **Vá para Configurações > Webhooks**
3. **Adicione um novo webhook com:**
   - URL: `https://wvojbjkdlnvlqgjwtdaf.supabase.co/functions/v1/ggcheckout-webhook`
   - Eventos: `pagamento_aprovado`
   - Método: `POST`
   - Secret: (use o mesmo valor do `GGCHECKOUT_WEBHOOK_SECRET`)

4. **Teste o webhook** enviando uma transação de teste

## 🔐 Variáveis de Ambiente (Secrets)

As seguintes variáveis estão configuradas no Supabase:

- `RESEND_API_KEY` - Chave da API do Resend para envio de e-mails
- `GGCHECKOUT_WEBHOOK_SECRET` - Secret para validação da assinatura
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase

## 📧 Template de E-mail

O sistema envia automaticamente um e-mail de boas-vindas com:

- **Assunto:** "Seu acesso foi liberado! 🎉"
- **Conteúdo:** Nome do cliente, produto comprado, login e senha
- **Design:** Template HTML responsivo e profissional
- **Link:** Botão direto para área de membros

### Exemplo de E-mail:
```
Olá João Silva,
Obrigado por sua compra do produto Curso Completo de Marketing!

📋 Seus dados de acesso:
Login: joao@email.com
Senha: Ab3$kL9mN2pQ

[🚀 Acessar Área de Membros]

Bom aprendizado! 📚
```

## 🔄 Fluxo de Processamento

1. **GGCheckout envia webhook** quando pagamento é aprovado
2. **Sistema valida assinatura** HMAC SHA-256
3. **Verifica se usuário já existe** (evita duplicatas)
4. **Gera senha segura** (12 caracteres aleatórios)
5. **Cria usuário no banco** com senha criptografada
6. **Envia e-mail de boas-vindas** com dados de acesso
7. **Registra logs** para monitoramento

## 📈 Monitoramento

### Logs de Webhook
Todos os webhooks são registrados na tabela `webhook_logs` com:
- Payload completo recebido
- Status do processamento
- Mensagens de erro (se houver)
- Timestamp de cada evento

### Status Possíveis:
- `received` - Webhook recebido com sucesso
- `processed` - Usuário criado e e-mail enviado
- `skipped` - Usuário já existia para esta transação
- `ignored` - Evento não processado (ex: pagamento negado)
- `error` - Erro durante processamento

## 🛡️ Segurança

- **Validação de assinatura HMAC** em todos os webhooks
- **Senhas criptografadas** com SHA-256
- **Row Level Security (RLS)** no banco de dados
- **CORS configurado** para requisições web
- **Logs de auditoria** de todas as operações

## 🚀 Deploy Automático

O sistema está configurado para deploy automático:
- Edge Functions são deployadas automaticamente
- Banco de dados sincronizado via migrações
- Secrets gerenciados pelo Supabase
- SSL/TLS automático para HTTPS

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no Supabase Dashboard
2. Teste o webhook com transações de teste
3. Confirme configuração dos secrets
4. Valide URL e eventos na GGCheckout

## 🔧 Desenvolvimento Local

Para testar localmente (opcional):
```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Sincronizar projeto
supabase link --project-ref wvojbjkdlnvlqgjwtdaf

# Executar funções localmente
supabase functions serve ggcheckout-webhook
```

---

## Projeto Original Lovable

**URL**: https://lovable.dev/projects/45339df3-9b91-487e-bbf9-219f12acc057

### Tecnologias Frontend:
- Vite, TypeScript, React
- shadcn-ui, Tailwind CSS
- Supabase Integration

### Deploy:
Abra [Lovable](https://lovable.dev/projects/45339df3-9b91-487e-bbf9-219f12acc057) e clique em Share → Publish.

**Sistema pronto para produção! 🎉**
