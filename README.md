# 🚀 Crypto Luxe Portal - Sistema de Educação em Criptomoedas

Um portal educacional completo para aprendizado sobre Bitcoin, criptomoedas e blockchain, com sistema de autenticação, módulos interativos e painel administrativo.

## 🎯 Funcionalidades Principais

### 📚 **Módulos Educacionais**
- **Origens do Bitcoin** - História e fundamentos do Bitcoin
- **Tecnologia Blockchain** - Conceitos técnicos e aplicações
- **Trading de Criptomoedas** - Estratégias e análise técnica
- **Segurança de Carteiras** - Melhores práticas de segurança
- **Investimento em Cripto** - Planejamento e gestão de risco
- **Módulo Avançado** - Conteúdo especializado

### 🔐 **Sistema de Autenticação**
- ✅ Login/Registro com Supabase Auth
- ✅ Recuperação de senha via e-mail
- ✅ Proteção de rotas com React Router
- ✅ Context API para gerenciamento de estado
- ✅ Integração com Supabase para dados de usuário

### 📊 **Dashboard Interativo**
- ✅ Portfolio de criptomoedas com gráficos (preços fixos de referência)
- ✅ Ranking de usuários
- ✅ Feed da comunidade
- ✅ Relatórios mensais
- ✅ Estatísticas de progresso

### 🎥 **Sistema de Vídeos**
- ✅ Player de vídeo integrado
- ✅ Progresso automático de lições
- ✅ Sistema de módulos com capas
- ✅ Gerenciamento de conteúdo via admin

### 👨‍💼 **Painel Administrativo**
- ✅ Gerenciamento de usuários
- ✅ Upload e edição de vídeos
- ✅ Monitoramento de sistema
- ✅ Logs de atividade
- ✅ Configurações avançadas

## 🏗️ Arquitetura Técnica

### **Frontend**
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **React Router DOM** para navegação
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **Lucide React** para ícones

### **Backend & Database**
- **Supabase** para autenticação, banco de dados e Edge Functions
- **PostgreSQL** com Row Level Security (RLS)

### **Integrações**
- **Amazon SES** para envio de e-mails
- **GGCheckout** para processamento de pagamentos
- **Webhooks** para automação

## 📁 Estrutura do Projeto

```
crypto-luxe-portal/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes shadcn/ui
│   │   ├── PortfolioChart.tsx
│   │   ├── CommunityFeed.tsx
│   │   ├── VideoManager.tsx
│   │   └── ...
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── AdminPanel.tsx
│   │   └── ...
│   ├── contexts/           # Context API
│   │   ├── AuthContext.tsx
│   │   └── AdminAuthContext.tsx
│   ├── hooks/              # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── usePortfolio.ts
│   │   └── ...
│   ├── lib/                # Configurações
│   │   ├── firebase.ts
│   │   └── utils.ts
│   └── integrations/       # Integrações externas
│       └── supabase/
├── supabase/               # Configuração Supabase
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrações do banco
├── public/                 # Assets estáticos
└── docs/                   # Documentação
```

## 🔧 Configuração e Instalação

### **Pré-requisitos**
- Node.js 18+
- npm ou yarn
- Conta Supabase

### **Instalação**

```bash
# Clone o repositório
git clone [url-do-repositorio]
cd crypto-luxe-portal

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

### **Variáveis de Ambiente**

Crie um arquivo `.env.local` com:

```env
# Firebase
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=seu_app_id

# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### **Executar o Projeto**

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🗄️ Estrutura do Banco de Dados

### **Tabelas Principais**

#### `users`
- `id` (UUID) - ID único do usuário
- `firebase_uid` (TEXT) - UID do Firebase
- `email` (TEXT) - E-mail do usuário
- `full_name` (TEXT) - Nome completo
- `created_at` (TIMESTAMP) - Data de criação

#### `user_progress`
- `id` (UUID) - ID único
- `user_id` (UUID) - Referência ao usuário
- `module_id` (TEXT) - ID do módulo
- `lesson_id` (TEXT) - ID da lição
- `completed` (BOOLEAN) - Status de conclusão
- `progress_percentage` (INTEGER) - Porcentagem de progresso

#### `portfolio_transactions`
- `id` (UUID) - ID único
- `user_id` (UUID) - Referência ao usuário
- `crypto_symbol` (TEXT) - Símbolo da cripto
- `transaction_type` (TEXT) - Compra/Venda
- `amount` (DECIMAL) - Quantidade
- `price` (DECIMAL) - Preço unitário
- `date` (TIMESTAMP) - Data da transação

#### `community_posts`
- `id` (UUID) - ID único
- `user_id` (UUID) - Referência ao usuário
- `content` (TEXT) - Conteúdo do post
- `created_at` (TIMESTAMP) - Data de criação

#### `module_covers`
- `id` (UUID) - ID único
- `module_id` (TEXT) - ID do módulo
- `cover_url` (TEXT) - URL da imagem de capa
- `title` (TEXT) - Título do módulo
- `description` (TEXT) - Descrição

## 🔐 Segurança

### **Autenticação**
- Firebase Authentication com múltiplos provedores
- Tokens JWT seguros
- Refresh tokens automáticos
- Proteção de rotas com React Router

### **Banco de Dados**
- Row Level Security (RLS) no Supabase
- Políticas de acesso por usuário
- Validação de dados com TypeScript
- Sanitização de inputs

### **Webhooks**
- Validação HMAC SHA-256 para GGCheckout
- Logs de auditoria completos
- Prevenção de duplicatas
- Tratamento de erros robusto

## 📊 Funcionalidades Avançadas

### **Sistema de Portfolio**
- ✅ Adicionar/remover transações
- ✅ Cálculo automático de P&L
- ✅ Gráficos interativos
- ✅ Distribuição por criptomoeda
- ✅ Relatórios mensais

### **Feed da Comunidade**
- ✅ Posts em tempo real
- ✅ Sistema de likes
- ✅ Comentários
- ✅ Moderação automática

### **Sistema de Módulos**
- ✅ Progresso automático
- ✅ Certificados de conclusão
- ✅ Conteúdo dinâmico
- ✅ Integração com vídeos

### **Monitoramento**
- ✅ Logs de erro em tempo real
- ✅ Métricas de performance
- ✅ Alertas de conectividade
- ✅ Status do sistema

## 🚀 Deploy

### **Vercel (Recomendado)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Netlify**
```bash
# Build
npm run build

# Deploy manual via interface
```

### **Firebase Hosting**
```bash
# Instalar Firebase CLI
npm i -g firebase-tools

# Login e deploy
firebase login
firebase deploy
```

## 🔧 Desenvolvimento

### **Scripts Disponíveis**
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build
npm run lint         # Linting do código
npm run type-check   # Verificação de tipos
```

### **Estrutura de Componentes**
- **Atomic Design** para organização
- **Composition Pattern** para reutilização
- **Custom Hooks** para lógica de negócio
- **Context API** para estado global

### **Padrões de Código**
- **TypeScript** para type safety
- **ESLint** para qualidade de código
- **Prettier** para formatação
- **Husky** para pre-commit hooks

## 📈 Monitoramento e Analytics

### **Firebase Analytics**
- Eventos de usuário
- Conversões
- Retenção
- Performance

### **Supabase Logs**
- Queries de banco
- Autenticação
- Edge Functions
- Webhooks

### **Vercel Analytics**
- Performance de páginas
- Core Web Vitals
- Erros de JavaScript
- Métricas de usuário

## 🛠️ Troubleshooting

### **Problemas Comuns**

#### **Erro 400 do Firestore**
- Verificar configuração do Firebase
- Confirmar regras de segurança
- Validar conectividade de rede

#### **Erro de Autenticação**
- Verificar tokens do Firebase
- Confirmar configuração do Supabase
- Validar políticas RLS

#### **Problemas de Performance**
- Otimizar queries do Firestore
- Implementar cache adequado
- Verificar bundle size

### **Logs de Debug**
```javascript
// Habilitar logs detalhados
localStorage.setItem('debug', 'firebase:*');
```

## 🤝 Contribuição

### **Como Contribuir**
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### **Padrões de Commit**
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

## 📞 Suporte

### **Canais de Ajuda**
- **Issues do GitHub** para bugs
- **Discussions** para dúvidas
- **Documentação** para guias
- **Email** para suporte direto

### **Recursos Úteis**
- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- **Firebase** pela infraestrutura
- **Supabase** pelo banco de dados
- **Vercel** pelo deploy
- **shadcn/ui** pelos componentes
- **Tailwind CSS** pela estilização

---

## 🎉 Status do Projeto

**✅ Produção Pronta**
- Sistema estável e testado
- Todas as funcionalidades implementadas
- Performance otimizada
- Segurança validada

**🚀 Próximos Passos**
- Implementar testes automatizados
- Adicionar mais módulos educacionais
- Expandir funcionalidades de portfolio
- Melhorar UX/UI

---

**Desenvolvido com ❤️ para a comunidade crypto! 🚀**
