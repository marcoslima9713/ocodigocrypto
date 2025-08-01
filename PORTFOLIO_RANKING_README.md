# 🏆 Ranking de Performance de Portfólio - Documentação

## 🎯 Visão Geral

O **Sistema de Ranking de Performance** é uma funcionalidade completa que exibe rankings competitivos dos usuários baseados em diferentes métricas de desempenho do portfólio. Ele promove engajamento, motivação e transparência na comunidade de investidores.

## ✨ Funcionalidades Principais

### 📊 Três Categorias de Ranking

#### 1. 🥇 **Top 10 Retorno Percentual**
- **Métrica**: Maior ganho relativo do portfólio total
- **Cálculo**: `(Valor Atual - Total Investido) / Total Investido * 100`
- **Exemplo**: "+35.7%" com badge "Top Trader"

#### 2. 💎 **Top 10 Valorização de Cripto Específica**
- **Métrica**: Maior valorização de uma única criptomoeda
- **Cálculo**: Melhor ativo individual no portfólio
- **Exemplo**: "BTC" com "+42.3%" de valorização

#### 3. 📈 **Top 10 Estratégia DCA**
- **Métrica**: Melhor resultado em Dollar-Cost Averaging
- **Cálculo**: Número de compras + eficiência do preço médio
- **Exemplo**: "15 compras" com badge "DCA Master"

### ⏰ Janelas de Tempo
- **7 Dias**: Performance semanal
- **30 Dias**: Performance mensal
- **Atualização**: Automática diária às 00:00 UTC

## 🎨 Design e Interface

### 🎯 Layout Responsivo
```
┌─────────────────────────────────────┐
│ 🏆 Ranking de Performance           │
│ [7 Dias] [30 Dias] [Atualizar]     │
├─────────────────────────────────────┤
│ [Retorno %] [Melhor Ativo] [DCA]   │
├─────────────────────────────────────┤
│ 🥇 #1 | @traderX | +35.7% | 🏆     │
│ 🥈 #2 | Julia | +28.4% | 🥇        │
│ 🥉 #3 | Carlos | +22.1% | 📈       │
└─────────────────────────────────────┘
```

### 🎨 Elementos Visuais
- **Medalhas**: 🥇🥈🥉 para top 3
- **Badges**: 🏆 Top Trader, 🥇 Elite Trader, 📈 DCA Master
- **Cores**: Verde (positivo), Vermelho (negativo), Azul (neutro)
- **Avatares**: Cores dinâmicas baseadas no nome
- **Animações**: Framer Motion para transições suaves

## 🗄️ Estrutura do Banco de Dados

### Materialized View Principal
```sql
CREATE MATERIALIZED VIEW portfolio_performance_rankings AS
WITH portfolio_summary AS (
    SELECT 
        t.user_id,
        t.crypto_symbol,
        SUM(CASE WHEN t.transaction_type = 'buy' THEN t.amount ELSE 0 END) as total_quantity,
        SUM(CASE WHEN t.transaction_type = 'buy' THEN t.total_usd ELSE 0 END) as invested_amount,
        AVG(CASE WHEN t.transaction_type = 'buy' THEN t.price_usd END) as avg_buy_price,
        COUNT(CASE WHEN t.transaction_type = 'buy' THEN 1 END) as buy_count
    FROM public.transactions t
    WHERE t.transaction_type = 'buy'
    GROUP BY t.user_id, t.crypto_symbol
),
user_totals AS (
    SELECT 
        pv.user_id,
        SUM(pv.invested_amount) as total_invested,
        SUM(pv.current_value) as total_current_value,
        (SUM(pv.unrealized_pnl) / SUM(pv.invested_amount) * 100) as total_return_percent,
        SUM(pv.buy_count) as total_buy_count,
        MAX(pv.return_percent) as best_asset_return,
        MAX(CASE WHEN pv.return_percent = MAX(pv.return_percent) THEN pv.crypto_symbol END) as best_asset
    FROM portfolio_values pv
    GROUP BY pv.user_id
)
SELECT 
    ut.user_id,
    u.display_name as user_name,
    ut.total_return_percent as return_percent,
    ut.best_asset as top_asset,
    ut.best_asset_return as top_asset_return,
    ut.total_buy_count as dca_purchase_count,
    CASE 
        WHEN ut.total_return_percent >= 50 THEN 'Top Trader'
        WHEN ut.total_return_percent >= 25 THEN 'Elite Trader'
        WHEN ut.total_buy_count >= 10 THEN 'DCA Master'
        ELSE NULL
    END as badge
FROM user_totals ut
JOIN public.users u ON ut.user_id = u.id
WHERE 
    u.created_at < NOW() - INTERVAL '7 days'
    AND ut.total_invested > 100
    AND EXISTS (
        SELECT 1 FROM public.user_privacy_settings ups 
        WHERE ups.user_id = u.id AND ups.show_in_community_feed = true
    );
```

### Índices de Performance
```sql
CREATE INDEX idx_portfolio_rankings_user_id ON portfolio_performance_rankings (user_id, time_window);
CREATE INDEX idx_portfolio_rankings_return_percent ON portfolio_performance_rankings (return_percent DESC, time_window);
CREATE INDEX idx_portfolio_rankings_top_asset ON portfolio_performance_rankings (top_asset_return DESC, time_window);
CREATE INDEX idx_portfolio_rankings_dca ON portfolio_performance_rankings (dca_purchase_count DESC, time_window);
```

## 🔧 Configuração Técnica

### 1. Executar Migração
```bash
# Executar no Supabase SQL Editor
supabase/migrations/20250731204000_create_portfolio_rankings.sql
```

### 2. Atualização Automática
```sql
-- Função para atualizar rankings
CREATE OR REPLACE FUNCTION public.refresh_portfolio_rankings()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.portfolio_performance_rankings;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar quando transações mudam
CREATE TRIGGER trigger_update_rankings
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rankings_on_transaction();
```

### 3. Agendamento (Cron)
```sql
-- Atualizar diariamente às 00:00 UTC
SELECT cron.schedule('refresh_portfolio_rankings', '0 0 * * *', 
  $$REFRESH MATERIALIZED VIEW portfolio_performance_rankings$$);
```

## 🚀 Como Usar

### 1. Acessar a Página
```bash
# URL: /ranking
# Requer autenticação
```

### 2. Navegação
- **Tabs de Tempo**: Alternar entre 7 dias e 30 dias
- **Tabs de Categoria**: Retorno %, Melhor Ativo, Estratégia DCA
- **Botão Atualizar**: Refresh manual dos dados

### 3. Interação
- **Clique nos nomes**: Navegação para perfil (futuro)
- **Hover nos cards**: Efeitos visuais
- **Scroll**: Visualização de todos os rankings

## 📊 Critérios de Elegibilidade

### ✅ Requisitos Obrigatórios
1. **Conta Ativa**: Mínimo 7 dias desde criação
2. **Investimento Mínimo**: $100 ou equivalente
3. **Perfil Público**: Configuração de privacidade ativada
4. **Transações Válidas**: Pelo menos uma compra registrada

### ❌ Exclusões Automáticas
- Usuários com menos de 7 dias
- Portfólios com menos de $100
- Usuários com perfil privado
- Contas inativas

## 🏅 Sistema de Badges

### 🏆 Top Trader
- **Critério**: Retorno ≥ 50%
- **Ícone**: 🏆
- **Cor**: Amarelo dourado

### 🥇 Elite Trader
- **Critério**: Retorno ≥ 25%
- **Ícone**: 🥇
- **Cor**: Cinza prateado

### 📈 DCA Master
- **Critério**: ≥ 10 compras
- **Ícone**: 📈
- **Cor**: Azul

## 📱 Responsividade

### Desktop (≥1024px)
- **Layout**: Cards em coluna única
- **Informações**: Completas com métricas detalhadas
- **Interações**: Hover effects completos

### Tablet (768px - 1023px)
- **Layout**: Cards adaptados
- **Informações**: Métricas principais
- **Interações**: Touch-friendly

### Mobile (<768px)
- **Layout**: Cards empilhados
- **Informações**: Essenciais apenas
- **Interações**: Otimizadas para touch

## 🔒 Privacidade e Segurança

### Controles de Privacidade
- **Opt-in**: Usuário deve ativar perfil público
- **Configuração**: Via `user_privacy_settings`
- **Respeito**: Dados pessoais protegidos

### Segurança de Dados
- **Autenticação**: JWT obrigatório
- **Validação**: Dados sanitizados
- **Auditoria**: Logs de acesso

## 📈 Performance e Otimização

### Cache Strategy
- **Materialized View**: Dados pré-calculados
- **Índices**: Consultas otimizadas
- **Atualização**: Incremental diária

### Métricas de Performance
- **Tempo de Carregamento**: < 500ms
- **Tempo de Interação**: < 100ms
- **Bundle Size**: ~25KB (gzipped)

## 🧪 Testes

### Testes Unitários
```bash
npm test -- --testPathPattern=PortfolioRanking
```

### Testes de Integração
```bash
npm run test:integration -- --testPathPattern=portfolio-ranking
```

### Testes de Performance
```bash
npm run test:performance -- --testPathPattern=ranking
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Rankings não aparecem
```sql
-- Verificar se há dados elegíveis
SELECT COUNT(*) FROM portfolio_performance_rankings WHERE time_window = '7_days';
```

#### 2. Atualização não funciona
```sql
-- Verificar trigger
SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_update_rankings';
```

#### 3. Performance lenta
```sql
-- Verificar índices
SELECT * FROM pg_indexes WHERE tablename = 'portfolio_performance_rankings';
```

### Logs de Debug
```tsx
// Habilitar logs de debug
const { rankings, loading, error } = usePortfolioRankings({
  debug: true
});
```

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] **Filtros Avançados**: Por ativo, período, região
- [ ] **Histórico**: Rankings históricos
- [ ] **Notificações**: Alertas para top 10
- [ ] **Gamificação**: Pontos e conquistas
- [ ] **Compartilhamento**: Compartilhar posição
- [ ] **Análise Detalhada**: Gráficos de performance

### Melhorias Técnicas
- [ ] **Cache Redis**: Para consultas frequentes
- [ ] **API Rate Limiting**: Proteção contra spam
- [ ] **Real-time Updates**: WebSocket para mudanças
- [ ] **Export Data**: CSV/PDF dos rankings
- [ ] **Mobile App**: Versão nativa

## 📞 Suporte

### Contato
- **Email**: suporte@cryptoluxe.com
- **Discord**: [CryptoLuxe Community](https://discord.gg/cryptoluxe)
- **GitHub**: [Issues](https://github.com/cryptoluxe/portfolio-ranking/issues)

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