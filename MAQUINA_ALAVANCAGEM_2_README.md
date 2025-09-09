# Módulo Máquina de Alavancagem 2

## 📋 Visão Geral

Este módulo implementa um sistema completo de monitoramento e análise de oportunidades de arbitragem de funding rate em criptomoedas. A estratégia permite gerar renda passiva através de posições neutras no mercado de futuros perpétuos.

## 🎯 Funcionalidades Principais

### 1. Monitoramento em Tempo Real
- **Funding Rates**: Busca dados de funding rate da Binance
- **Atualização Automática**: Dados atualizados a cada 5 minutos
- **Múltiplos Ativos**: Foco em BTC/USDT e ETH/USDT

### 2. Análise de Oportunidades
- **Identificação Automática**: Detecta as melhores oportunidades de arbitragem
- **Classificação de Risco**: LOW, MEDIUM, HIGH baseado na volatilidade do funding rate
- **Cálculo de Retornos**: Projeções diárias, mensais e anuais

### 3. Simulador de Posições
- **Cálculo Interativo**: Simula retornos baseado no capital investido
- **Dados Binance**: Oportunidades da maior exchange de criptomoedas
- **Gestão de Risco**: Avisos sobre níveis de risco

### 4. Widget do Dashboard
- **Visão Rápida**: Resumo das melhores oportunidades
- **Status do Mercado**: Indicadores visuais do estado atual
- **Alertas**: Notificações sobre funding rates altos

## 🏗️ Arquitetura

### Serviços
- `fundingRateService.ts`: Serviço principal para APIs de funding rate
- `useFundingRates.ts`: Hook personalizado para gerenciamento de estado

### Componentes
- `FundingArbitrageModule.tsx`: Página principal do módulo
- `FundingRateWidget.tsx`: Widget para o dashboard

### APIs Integradas
- **Binance Futures**: `https://fapi.binance.com/fapi/v1` (única fonte de dados)

## 📊 Estratégia de Arbitragem

### Como Funciona
1. **Posição Neutra**: Compra no spot + Venda no futuro
2. **Exposição Zero**: Não ganha nem perde com variação de preço
3. **Captura de Funding**: Recebe funding rate positivo dos traders

### Exemplo Prático
```
Capital: $10.000 USDT
Posição: 0,25 BTC spot + 0,25 BTC short futuro
Funding Rate: 0,01% a cada 8h
Retorno Diário: ~$3 USDT
Retorno Mensal: ~$90 USDT (0,9%)
```

## 🚀 Instalação e Configuração

### 1. Executar Script SQL
```sql
-- Executar o arquivo add_funding_arbitrage_module.sql
-- Isso criará o módulo no banco de dados
```

### 2. Verificar Rotas
```typescript
// App.tsx já inclui a rota:
<Route path="/modulo/maquina-alavancagem-2" element={<FundingArbitrageModule />} />
```

### 3. Adicionar Widget ao Dashboard (Opcional)
```typescript
// No Dashboard.tsx, adicionar:
import { FundingRateWidget } from '@/components/FundingRateWidget';

// E incluir no layout:
<FundingRateWidget />
```

## 📈 Monitoramento

### Métricas Principais
- **Funding Rate Atual**: Taxa de financiamento em tempo real
- **Retorno Anualizado**: Projeção de retorno anual
- **Risco**: Classificação LOW/MEDIUM/HIGH
- **Próximo Funding**: Tempo até o próximo pagamento

### Alertas
- **Funding Rates Altos**: Quando > 0,01%
- **Mercado Volátil**: Mudanças significativas
- **Oportunidades**: Novas oportunidades detectadas

## 🔧 Personalização

### Adicionar Novas Exchanges
```typescript
// Em fundingRateService.ts
async getNewExchangeFundingRates(): Promise<FundingRateData[]> {
  // Implementar nova API
}
```

### Modificar Ativos Monitorados
```typescript
// Em getArbitrageOpportunities()
const targetSymbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT']; // Adicionar novos
```

### Ajustar Intervalos de Atualização
```typescript
// Em useFundingRates.ts
const interval = setInterval(loadData, 5 * 60 * 1000); // 5 minutos
```

## ⚠️ Considerações de Risco

### Riscos Identificados
1. **Liquidação**: Manter margem suficiente
2. **Funding Negativo**: Pode pagar em vez de receber
3. **Slippage**: Diferença entre preços spot e futuro
4. **Correlação**: Posições podem não ser 100% neutras

### Mitigações
- **Monitoramento Contínuo**: Alertas em tempo real
- **Diversificação**: Múltiplas exchanges e ativos
- **Stop Loss**: Limites de perda automáticos
- **Educação**: Explicações detalhadas no módulo

## 📱 Interface do Usuário

### Design Responsivo
- **Mobile First**: Otimizado para dispositivos móveis
- **Dark Theme**: Interface escura para melhor experiência
- **Animações**: Transições suaves com Framer Motion

### Componentes UI
- **Cards**: Informações organizadas em cards
- **Badges**: Indicadores de risco e status
- **Progress Bars**: Visualização de progresso
- **Charts**: Gráficos de dados históricos (futuro)

## 🔮 Roadmap

### Próximas Funcionalidades
1. **Gráficos Históricos**: Visualização de funding rates ao longo do tempo
2. **Alertas Push**: Notificações em tempo real
3. **Backtesting**: Simulação de estratégias passadas
4. **Integração com Portfólio**: Rastreamento de posições reais
5. **API de Trading**: Execução automática de ordens

### Melhorias Técnicas
1. **Cache Inteligente**: Otimização de requisições
2. **WebSocket**: Dados em tempo real
3. **Machine Learning**: Predição de funding rates
4. **Multi-language**: Suporte a múltiplos idiomas

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do console
2. Testar APIs individualmente
3. Verificar conectividade de rede
4. Consultar documentação das exchanges

## 📄 Licença

Este módulo faz parte do projeto Crypto Luxe Portal e segue as mesmas diretrizes de licenciamento.
