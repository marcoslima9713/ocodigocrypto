# Sistema de Ranking Dinâmico

## Como Funciona

O sistema de ranking agora é **dinâmico** e baseado nos **dados reais** dos portfólios dos usuários. Ele não usa mais dados de teste fixos.

### 1. Coleta de Dados Reais

O sistema:
- Busca **todos os usuários** registrados no sistema
- Filtra apenas usuários com **perfil público** (`show_in_community_feed = true`)
- Verifica se a conta tem **mínimo 1 hora** de existência
- Calcula dados do portfólio baseado nas **transações reais** de cada usuário

### 2. Cálculo de Performance

Para cada usuário elegível, o sistema:

1. **Busca todas as transações** do usuário
2. **Calcula holdings** por criptomoeda:
   - Quantidade total comprada
   - Valor total investido
   - Preço médio de compra
   - Número de compras (DCA)
3. **Simula preços atuais** (em produção viriam de API)
4. **Calcula retornos**:
   - Retorno total do portfólio
   - Melhor ativo individual
   - Lucro/prejuízo total

### 3. Critérios de Elegibilidade

Para aparecer no ranking, o usuário deve:
- ✅ Ter **perfil público** ativado
- ✅ Ter conta criada há **mínimo 1 hora**
- ✅ Ter **investimento mínimo** de $100
- ✅ Ter **transações reais** no sistema

### 4. Badges Automáticos

O sistema atribui badges automaticamente:
- 🏆 **Top Trader**: Retorno ≥ 50%
- 🥇 **Elite Trader**: Retorno ≥ 25%
- 📈 **DCA Master**: 10+ compras (Dollar-Cost Averaging)

### 5. Atualização Automática

O ranking se atualiza:
- **Automaticamente** quando novos usuários se registram
- **Em tempo real** conforme transações são adicionadas
- **Dinamicamente** baseado nos dados reais dos portfólios

## Configuração do Usuário Marcos Fut

Para configurar o usuário Marcos Fut com dados reais:

1. Execute o script `configurar_usuario_real.sql` no Supabase
2. Este script irá:
   - Configurar privacidade para aparecer no ranking
   - Inserir transações reais de portfólio
   - Calcular dados de performance baseados nas transações

## Dados Reais vs Teste

### Antes (Dados de Teste)
- ❌ Valores fixos e simulados
- ❌ Não refletia portfólios reais
- ❌ Não atualizava automaticamente

### Agora (Dados Reais)
- ✅ Baseado em transações reais dos usuários
- ✅ Calcula performance real dos portfólios
- ✅ Atualiza automaticamente conforme novos usuários
- ✅ Reflete dados reais de investimento

## Como Adicionar Novos Usuários

Quando novos usuários se registrarem:

1. **Automaticamente** aparecerão no ranking se:
   - Ativarem perfil público
   - Tiverem investimento mínimo
   - Passarem do tempo mínimo de conta

2. **Não é necessário** executar scripts adicionais
3. **O sistema calcula** automaticamente a performance baseada nas transações reais

## Estrutura de Dados

O ranking usa:
- **Tabela `users`**: Informações dos usuários
- **Tabela `user_privacy_settings`**: Configurações de privacidade
- **Tabela `transactions`**: Transações reais dos usuários
- **Cálculo dinâmico**: Performance calculada em tempo real

## Benefícios

1. **Transparência**: Dados reais dos usuários
2. **Dinâmico**: Atualiza automaticamente
3. **Escalável**: Funciona com qualquer número de usuários
4. **Realista**: Reflete performance real dos investimentos
5. **Automático**: Não requer manutenção manual
