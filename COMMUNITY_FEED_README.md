# 📱 Feed da Comunidade - Documentação

## 🎯 Visão Geral

O **CommunityFeed** é um componente React que exibe atividades públicas dos usuários em um formato de timeline vertical, similar ao Twitter ou LinkedIn. Ele mostra transações de criptomoedas (compras, vendas e adições) de forma social e interativa.

## ✨ Funcionalidades

### 🔄 Atualização em Tempo Real
- **WebSocket**: Atualizações instantâneas via Supabase Realtime
- **Polling**: Fallback com atualização a cada 2 minutos
- **Indicador de Status**: Mostra se está conectado em tempo real

### 📊 Tipos de Ações
- **📈 Compra**: Usuário comprou criptomoedas
- **📉 Venda**: Usuário vendeu criptomoedas (com P&L)
- **➕ Adição**: Usuário adicionou fundos ao portfólio

### 🎨 Design Moderno
- **Timeline Vertical**: Layout com linha central conectando entradas
- **Avatares Dinâmicos**: Cores baseadas no nome do usuário
- **Badges Coloridos**: Indicadores visuais para tipos de ação
- **Animações Suaves**: Transições com Framer Motion

### 📱 Responsivo
- **Mobile-First**: Otimizado para dispositivos móveis
- **Lazy Loading**: Carrega mais itens ao rolar
- **Intersection Observer**: Performance otimizada

## 🗄️ Estrutura do Banco de Dados

### Tabela `community_feed`
```sql
CREATE TABLE public.community_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_display_name TEXT NOT NULL,
    user_username TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('buy', 'sell', 'add')),
    asset TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    price NUMERIC NOT NULL CHECK (price >= 0),
    total_value NUMERIC NOT NULL CHECK (total_value >= 0),
    pnl_percent NUMERIC,
    pnl_amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_asset CHECK (asset ~ '^[A-Z]{2,10}$')
);
```

### Tabela `user_privacy_settings`
```sql
CREATE TABLE public.user_privacy_settings (
    user_id TEXT PRIMARY KEY,
    show_in_community_feed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 🚀 Como Usar

### 1. Importar o Componente
```tsx
import { CommunityFeed } from '@/components/CommunityFeed';
```

### 2. Usar no JSX
```tsx
<CommunityFeed 
  enableWebSocket={true}
  showPrivacyToggle={true}
  className="my-custom-class"
/>
```

### 3. Props Disponíveis
```tsx
interface CommunityFeedProps {
  className?: string;           // Classes CSS customizadas
  enableWebSocket?: boolean;    // Habilitar WebSocket (padrão: false)
  showPrivacyToggle?: boolean;  // Mostrar toggle de privacidade (padrão: true)
}
```

## 🔧 Configuração

### 1. Executar Migração
```bash
# Executar no Supabase SQL Editor
supabase/migrations/20250731203000_create_community_feed.sql
```

### 2. Configurar Trigger
O trigger `trigger_insert_community_feed` é criado automaticamente para inserir entradas no feed quando transações são criadas.

### 3. Configurar Privacidade
```sql
-- Inserir configuração de privacidade para um usuário
INSERT INTO user_privacy_settings (user_id, show_in_community_feed)
VALUES ('user_id_here', true);
```

## 📊 Exemplos de Mensagens

### Compra
```
"Carlos Silva comprou 0.500000 BTC por $45.000,00 cada ($22.500 total)"
```

### Venda com Lucro
```
"@carlos_silva vendeu 0.500000 BTC por $45.000,00 cada ($22.500 total) com lucro de +12.50%"
```

### Venda com Prejuízo
```
"Ana Costa vendeu 1000.000000 ADA por $0,45 cada ($450 total) com prejuízo de -5.20%"
```

### Adição
```
"Julia Santos adicionou $1.550 em LINK"
```

## 🎨 Personalização

### Cores dos Avatares
```tsx
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};
```

### Ícones das Ações
```tsx
const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'buy': return '📈';
    case 'sell': return '📉';
    case 'add': return '➕';
    default: return '💼';
  }
};
```

## 🔒 Privacidade

### Controles de Privacidade
- **Toggle Público/Privado**: Botão para controlar visibilidade
- **Configuração por Usuário**: Cada usuário pode escolher se aparece no feed
- **Dados Anônimos**: Nomes podem ser mascarados se necessário

### Configuração de Privacidade
```tsx
// Hook para gerenciar configurações de privacidade
const { updatePrivacySettings } = usePrivacySettings();

// Atualizar configuração
await updatePrivacySettings({
  show_in_community_feed: false
});
```

## 🧪 Testes

### Testes Unitários
```bash
npm test -- --testPathPattern=CommunityFeed
```

### Testes de Integração
```bash
npm run test:integration -- --testPathPattern=community-feed
```

## 📈 Performance

### Otimizações Implementadas
- **Memoização**: Componentes memoizados com React.memo
- **Lazy Loading**: Carregamento sob demanda
- **Intersection Observer**: Detecção eficiente de scroll
- **Debouncing**: Evita múltiplas requisições

### Métricas de Performance
- **Tempo de Carregamento**: < 200ms
- **Tempo de Interação**: < 100ms
- **Bundle Size**: ~15KB (gzipped)

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Feed não carrega
```bash
# Verificar conexão com Supabase
supabase status
```

#### 2. WebSocket não conecta
```bash
# Verificar configuração do Realtime
supabase config get realtime
```

#### 3. Dados não aparecem
```sql
-- Verificar se há dados na tabela
SELECT COUNT(*) FROM community_feed;
```

### Logs de Debug
```tsx
// Habilitar logs de debug
const { feed, loading, error } = useCommunityFeed({
  debug: true
});
```

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] **Filtros**: Por tipo de ação, ativo, período
- [ ] **Busca**: Pesquisar por usuário ou ativo
- [ ] **Notificações**: Push notifications para novas atividades
- [ ] **Comentários**: Sistema de comentários nas transações
- [ ] **Likes**: Sistema de curtidas
- [ ] **Compartilhamento**: Compartilhar transações

### Melhorias Técnicas
- [ ] **Cache**: Implementar cache Redis
- [ ] **CDN**: Otimizar carregamento de imagens
- [ ] **PWA**: Suporte a Progressive Web App
- [ ] **Offline**: Funcionalidade offline

## 📞 Suporte

### Contato
- **Email**: suporte@cryptoluxe.com
- **Discord**: [CryptoLuxe Community](https://discord.gg/cryptoluxe)
- **GitHub**: [Issues](https://github.com/cryptoluxe/community-feed/issues)

### Contribuição
1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ pela equipe CryptoLuxe** 