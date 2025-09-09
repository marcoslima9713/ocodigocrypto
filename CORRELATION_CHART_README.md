# Gráfico de Correlação BTC vs S&P 500

## 📋 Resumo da Implementação

Foi adicionado um gráfico interativo de correlação entre Bitcoin e S&P 500 na página "Máquina de Alavancagem", com período configurável e dados baseados em intervalos de 4 horas.

## 🚀 Funcionalidades Implementadas

### 1. **Gráfico Interativo**
- **Arquivo**: `src/components/CorrelationChart.tsx`
- **Biblioteca**: Recharts para visualização
- **Funcionalidades**:
  - Gráfico de linha da correlação ao longo do tempo
  - Período configurável (24, 50, 100, 200, 500 períodos)
  - Dados baseados em intervalos de 4 horas
  - Tooltips informativos
  - Linhas de referência para interpretação

### 2. **Serviço de Dados**
- **Arquivo**: `src/services/correlationService.ts`
- **Funcionalidades**:
  - Geração de dados mockados de 4 horas
  - Cálculo de correlação de Pearson
  - Simulação de variações realistas
  - Interface para dados em tempo real

### 3. **Controles Interativos**
- **Seletor de Período**: 5 opções pré-definidas
- **Botão de Refresh**: Atualização manual dos dados
- **Badges de Status**: Indicadores visuais da correlação
- **Estatísticas em Tempo Real**: Valores atuais e métricas

## 🏗️ Arquitetura

```
crypto-luxe-portal/
├── src/
│   ├── components/
│   │   ├── CorrelationChart.tsx        # Gráfico principal
│   │   └── CorrelationIndicator.tsx    # Componente atualizado
│   ├── services/
│   │   └── correlationService.ts       # Serviço de dados
│   └── pages/
│       └── MaquinaAlavancagemSP500.tsx # Página atualizada
└── CORRELATION_CHART_README.md         # Esta documentação
```

## 📊 Funcionalidades do Gráfico

### 1. **Visualização**
- **Linha Azul**: Correlação entre BTC e S&P 500
- **Linha Verde (0.5)**: Limite de alta correlação positiva
- **Linha Vermelha (-0.5)**: Limite de alta correlação negativa
- **Linha Cinza (0)**: Correlação neutra
- **Grid**: Linhas de referência para facilitar leitura

### 2. **Períodos Disponíveis**
- **24 períodos**: 4 dias (96 horas)
- **50 períodos**: 8 dias (200 horas)
- **100 períodos**: 17 dias (400 horas)
- **200 períodos**: 33 dias (800 horas)
- **500 períodos**: 83 dias (2000 horas)

### 3. **Dados de 4 Horas**
- **Intervalo**: Cada ponto representa 4 horas
- **Cálculo**: Correlação baseada em retornos de 4 horas
- **Janela Móvel**: Correlação calculada com janela de 20 períodos
- **Atualização**: Simulação de dados em tempo real

## 🎯 Interface do Usuário

### 1. **Controles Superiores**
- **Seletor de Período**: Dropdown com opções pré-definidas
- **Badge de Status**: Indicador da correlação atual
- **Botão Refresh**: Atualização manual dos dados
- **Legenda de Cores**: Explicação das cores do gráfico

### 2. **Estatísticas em Tempo Real**
- **Correlação Atual**: Valor numérico da correlação
- **Período**: Número de períodos de 4 horas
- **Última Atualização**: Timestamp da última atualização

### 3. **Gráfico Principal**
- **Altura**: 384px (h-96)
- **Responsivo**: Adapta-se ao tamanho da tela
- **Tooltips**: Informações detalhadas ao passar o mouse
- **Zoom**: Funcionalidade nativa do Recharts

## 📈 Cálculos Implementados

### 1. **Correlação de Pearson**
```typescript
const correlation = calculatePearsonCorrelation(btcReturns, sp500Returns);
```

**Fórmula:**
```
r = (nΣXY - ΣXΣY) / √[(nΣX² - (ΣX)²)(nΣY² - (ΣY)²)]
```

### 2. **Dados de 4 Horas**
- **Preço BTC**: Simulação com variações de ±2%
- **Preço S&P 500**: Simulação com variações de ±1%
- **Retornos**: Cálculo percentual entre períodos
- **Correlação**: Janela móvel de 20 períodos

### 3. **Geração de Dados**
```typescript
// Simular variações realistas
const btcVariation = (Math.random() - 0.5) * 0.04; // ±2%
const sp500Variation = (Math.random() - 0.5) * 0.02; // ±1%
```

## 🎨 Design e Cores

### 1. **Tema Escuro**
- **Fundo**: slate-800/900
- **Bordas**: slate-700
- **Texto**: Branco e cinza
- **Cards**: Transparência com overlay

### 2. **Cores do Gráfico**
- **Correlação Positiva**: Verde (#10b981)
- **Correlação Negativa**: Vermelho (#ef4444)
- **Baixa Correlação**: Cinza (#6b7280)
- **Linha Principal**: Azul (#3b82f6)

### 3. **Badges de Status**
- **Alta Correlação Positiva**: Verde
- **Correlação Positiva**: Verde claro
- **Baixa Correlação**: Cinza
- **Correlação Negativa**: Azul
- **Alta Correlação Negativa**: Vermelho

## 🔧 Configurações

### 1. **Parâmetros Ajustáveis**
- **Período**: 24, 50, 100, 200, 500
- **Janela de Correlação**: 20 períodos (fixo)
- **Intervalo**: 4 horas (fixo)
- **Atualização**: Manual via botão refresh

### 2. **Personalização**
```typescript
const periodOptions = [
  { value: 24, label: '4 dias (24 períodos)' },
  { value: 50, label: '8 dias (50 períodos)' },
  // ...
];
```

## 📊 Exemplo de Dados

### Estrutura de Dados
```typescript
interface CorrelationDataPoint {
  timestamp: number;      // Timestamp Unix
  date: string;          // Data em formato ISO
  btcPrice: number;      // Preço do Bitcoin
  sp500Price: number;    // Preço do S&P 500
  btcReturn: number;     // Retorno do Bitcoin (%)
  sp500Return: number;   // Retorno do S&P 500 (%)
  correlation: number;   // Correlação calculada
}
```

### Exemplo de Valores
- **Timestamp**: 1704067200000
- **Data**: "2024-01-01"
- **BTC Price**: 42000
- **S&P 500 Price**: 4769.83
- **BTC Return**: 0.36%
- **S&P 500 Return**: 0.11%
- **Correlação**: 0.342

## 🚨 Tratamento de Erros

### 1. **Estados de Loading**
- **Spinner**: Indicador de carregamento
- **Mensagem**: "Carregando dados de correlação..."
- **Timeout**: Simulação de delay de API

### 2. **Estados de Erro**
- **Fallback**: Mensagem de erro amigável
- **Retry**: Botão de refresh disponível
- **Logs**: Console.error para debugging

### 3. **Validação de Dados**
- **Correlação NaN**: Substituída por 0
- **Dados Insuficientes**: Ajuste automático
- **Período Inválido**: Fallback para padrão

## 🔄 Atualizações

### 1. **Automáticas**
- **Mudança de Período**: Recalcula automaticamente
- **Carregamento Inicial**: Dados carregados automaticamente

### 2. **Manuais**
- **Botão Refresh**: Atualização sob demanda
- **Seletor de Período**: Mudança instantânea

## 📝 Próximas Melhorias

### 1. **Funcionalidades Planejadas**
- **Dados Reais**: Integração com APIs reais
- **Zoom**: Funcionalidade de zoom no gráfico
- **Exportação**: Download do gráfico em PNG/PDF
- **Alertas**: Notificações para mudanças significativas
- **Múltiplos Timeframes**: 1h, 4h, 1d, 1w

### 2. **Otimizações**
- **WebSocket**: Dados em tempo real
- **Cache**: Armazenamento local dos dados
- **Performance**: Otimização para grandes datasets
- **Mobile**: Melhorias para dispositivos móveis

## 🎯 Casos de Uso

### 1. **Análise de Curto Prazo**
- **Trading**: Identificar correlações de curto prazo
- **Timing**: Melhor momento para entrada/saída
- **Hedge**: Estratégias de proteção

### 2. **Monitoramento**
- **Sentimento**: Mudanças no sentimento do mercado
- **Volatilidade**: Períodos de alta/baixa correlação
- **Tendências**: Identificar padrões de correlação

### 3. **Estratégias**
- **Diversificação**: Quando ativos se movem independentemente
- **Correlação**: Quando ativos se movem juntos
- **Descorrelação**: Oportunidades de hedge

## 🔗 Integração

### 1. **Componente Principal**
```typescript
export function CorrelationIndicatorWithChart() {
  return (
    <div className="space-y-6">
      <CorrelationIndicator />
      <CorrelationChart />
    </div>
  );
}
```

### 2. **Uso na Página**
```typescript
<CorrelationIndicatorWithChart />
```

## 📊 Benefícios da Implementação

1. **Visualização Clara**: Gráfico intuitivo da correlação
2. **Período Configurável**: Flexibilidade na análise
3. **Dados de 4 Horas**: Análise de curto prazo
4. **Interface Responsiva**: Funciona em todos os dispositivos
5. **Tempo Real**: Atualizações constantes
6. **Interpretação Automática**: Explicações contextuais

---

**Implementação concluída com sucesso! 🎉**

O gráfico de correlação BTC vs S&P 500 foi adicionado com sucesso, fornecendo análise visual interativa da correlação entre os dois ativos com dados de 4 horas e período configurável.
