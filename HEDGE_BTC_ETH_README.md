# 🛡️ Hedge para Todos os Pares - Nova Funcionalidade

## 📋 Visão Geral

A página "Máquina de Alavancagem" agora inclui uma funcionalidade completa de hedge para todos os pares de ativos ativos, implementando uma estratégia de neutralização de risco direcional através de regressão linear usando dados reais da API da Binance.

## 🎯 Funcionalidades Implementadas

### 1. **Cálculo do Hedge Ratio (β) para Todos os Pares**
- **Regressão Linear Simples**: Y (retornos Ativo B) = β × X (retornos Ativo A) + ε
- **Coeficiente Angular**: O valor de β representa o hedge ratio para cada par
- **Interpretação**: Para cada $1.000 no primeiro ativo, shorte $β no segundo ativo
- **Exemplo**: β = 0.65 significa shortar $650 no segundo ativo para cada $1.000 no primeiro

### 2. **Planilha Completa de Hedge**
- **Colunas Obrigatórias**:
  - Data (formato DD/MM/AAAA)
  - Preços de fechamento diário de ambos os ativos
  - Retornos percentuais de ambos os ativos
  - Tamanho do hedge calculado = Retorno Ativo A × β
- **Dados Reais**: Preços obtidos da API da Binance em tempo real

### 3. **Visualização Gráfica**
- **Gráfico de Dispersão**: Pontos históricos BTC vs ETH
- **Linha de Regressão**: Visualização do hedge ratio
- **Estatísticas**: R², correlação, confiabilidade do modelo
- **Legenda Interativa**: Explicação dos elementos do gráfico

### 4. **Painel Dinâmico**
- **Hedge Ratio Atualizado**: Valor de β em tempo real
- **Calculadora de Posição**: Simula posições baseadas no capital
- **Alertas Inteligentes**: Avisos sobre baixa confiabilidade/correlação
- **Métricas de Qualidade**: R² e correlação com interpretação

### 5. **Exportação de Dados**
- **CSV Download**: Dados completos para planilhas externas
- **Copiar para Clipboard**: Dados em formato JSON
- **Formatação Brasileira**: Números e datas no padrão pt-BR

## 🏗️ Arquitetura Técnica

### Serviços Criados
```
src/services/hedgeService.ts          # Serviço principal de hedge
src/components/HedgeChart.tsx         # Componente do gráfico
src/components/HedgeTable.tsx         # Componente da planilha
src/components/HedgePanel.tsx         # Painel dinâmico
```

### Interfaces TypeScript
```typescript
interface HedgeData {
  date: string;
  btcPrice: number;
  ethPrice: number;
  btcReturn: number;
  ethReturn: number;
}

interface HedgeRatio {
  beta: number;
  rSquared: number;
  correlation: number;
  lastUpdate: string;
}

interface HedgePosition {
  btcPosition: number;
  ethPosition: number;
  hedgeRatio: number;
  totalValue: number;
}
```

## 📊 Métodologia de Cálculo

### 1. **Regressão Linear**
```javascript
// Y = βX + ε
// Onde:
// Y = retornos do ETH
// X = retornos do BTC
// β = hedge ratio (coeficiente angular)
// ε = erro residual
```

### 2. **Cálculo do Beta**
```javascript
// Covariância entre BTC e ETH
covariance = Σ((btc_i - btc_mean) × (eth_i - eth_mean))

// Variância do BTC
btc_variance = Σ((btc_i - btc_mean)²)

// Beta = covariância / variância
beta = covariance / btc_variance
```

### 3. **Métricas de Qualidade**
- **R² (R-squared)**: Qualidade do ajuste da linha aos dados
- **Correlação**: Força da relação linear entre BTC e ETH
- **Confiabilidade**: Classificação baseada no R²

## 🎨 Interface do Usuário

### Tabs Adicionadas
1. **Hedge BTC/ETH**: Painel principal com gráfico e calculadora
2. **Planilha**: Tabela completa com dados exportáveis

### Design Responsivo
- **Tema Escuro**: Mantido consistente com o resto da aplicação
- **Cores Intuitivas**: Verde para positivo, vermelho para negativo
- **Animações**: Transições suaves entre estados
- **Mobile-First**: Otimizado para dispositivos móveis

### Elementos Visuais
- **Gráfico SVG**: Dispersão com linha de regressão
- **Cards Informativos**: Métricas organizadas em cards
- **Badges de Status**: Indicadores de confiabilidade e correlação
- **Alertas Contextuais**: Avisos sobre qualidade dos dados

## 📈 Estratégia de Hedge

### Como Funciona
1. **Posição Long**: Mantenha sua posição em BTC
2. **Posição Short**: Abra posição short em ETH proporcional ao hedge ratio
3. **Neutralização**: O hedge busca neutralizar a exposição direcional
4. **Rebalanceamento**: Ajuste quando o hedge ratio mudar significativamente

### Exemplo Prático
```
Capital: $10.000 USDT
Hedge Ratio (β): 0.65
Posição BTC: $10.000 (long)
Posição ETH: $6.500 (short)
Exposição Líquida: $3.500 (long)
```

### Vantagens
- **Redução de Risco**: Minimiza exposição direcional
- **Eficiência**: Baseado em análise estatística robusta
- **Flexibilidade**: Adaptável a diferentes tamanhos de posição
- **Transparência**: Métricas claras de qualidade do modelo

## ⚠️ Considerações de Risco

### Limitações do Modelo
1. **Dados Históricos**: Baseado em correlações passadas
2. **Regime Changes**: Correlações podem mudar abruptamente
3. **Liquidação**: Risco de liquidação em posições alavancadas
4. **Custos**: Taxas de trading e funding rates

### Mitigações
- **Monitoramento Contínuo**: Atualização automática a cada 5 minutos
- **Alertas Inteligentes**: Avisos sobre baixa qualidade do modelo
- **Educação**: Explicações detalhadas sobre limitações
- **Diversificação**: Não depender apenas desta estratégia

## 🔧 Configuração e Uso

### Acesso à Funcionalidade
1. Navegue para "Máquina de Alavancagem 2"
2. Clique na aba "Hedge BTC/ETH"
3. Visualize o painel dinâmico e gráfico
4. Use a calculadora para simular posições
5. Acesse a aba "Planilha" para dados completos

### Exportação de Dados
1. Na aba "Planilha", clique em "CSV" para download
2. Ou clique em "Copiar" para clipboard
3. Use os dados em planilhas externas (Excel, Google Sheets)

### Interpretação dos Resultados
- **β > 1**: ETH mais volátil que BTC
- **β < 1**: BTC mais volátil que ETH
- **R² > 0.7**: Modelo altamente confiável
- **R² < 0.5**: Modelo com baixa confiabilidade

## 🚀 Roadmap Futuro

### Próximas Funcionalidades
1. **Múltiplos Períodos**: Hedge ratios para diferentes timeframes
2. **Outros Pares**: Extensão para outros pares de criptomoedas
3. **Backtesting**: Simulação de estratégias passadas
4. **Alertas Push**: Notificações sobre mudanças significativas
5. **Integração com Trading**: Execução automática de ordens

### Melhorias Técnicas
1. **APIs Reais**: Integração com CoinGecko/Binance
2. **Machine Learning**: Modelos mais sofisticados
3. **WebSocket**: Dados em tempo real
4. **Multi-language**: Suporte a múltiplos idiomas

## 📞 Suporte

Para dúvidas sobre a funcionalidade de hedge:
1. Verifique a documentação técnica
2. Teste com diferentes tamanhos de posição
3. Monitore a qualidade do modelo (R²)
4. Considere as limitações e riscos

## 📄 Licença

Esta funcionalidade faz parte do projeto Crypto Luxe Portal e segue as mesmas diretrizes de licenciamento.
