# Máquina de Alavancagem - S&P 500 & Bitcoin

## Visão Geral
Esta página foi completamente refatorada para substituir a funcionalidade de arbitragem estatística por uma análise avançada dos retornos mensais do S&P 500 e Bitcoin, incluindo dados históricos e em tempo real.

## Funcionalidades Implementadas

### 📊 Tabela de Retornos Mensais
- Exibição dos retornos mensais do S&P 500 e Bitcoin por ano
- Seletor para alternar entre os dois ativos
- Cálculo automático de totais anuais
- Médias mensais acumuladas
- Cores condicionais (verde para positivo, vermelho para negativo)
- Seleção configurável do número de anos (5 a 20 anos)

### 📈 Estatísticas de Performance
- Total de meses analisados
- Taxa de meses positivos vs. negativos
- Retorno médio mensal
- Melhor e pior mês
- Análise de volatilidade

### 📅 Dados de 2025 (S&P 500)
- Dados reais em tempo real via Yahoo Finance
- Apenas meses completamente fechados são exibidos
- Verificação automática de calendário
- Sem projeções ou estimativas futuras

### 🪙 Dados do Bitcoin
- Dados históricos de 2014-2024
- Retornos mensais calculados
- Análise de volatilidade e padrões sazonais
- Comparação com o S&P 500

## Fontes de Dados

### APIs Financeiras Integradas
1. **Yahoo Finance** (Principal)
   - Dados em tempo real do S&P 500
   - Histórico mensal detalhado
   - Dados de 2025 atualizados

2. **Alpha Vantage** (Fallback)
   - API alternativa para redundância
   - Dados de mercado em tempo real

3. **Dados Históricos Locais**
   - Dados de 2014-2024 para análise histórica
   - Cálculos de retornos mensais

### Estratégia de Fallback
- Yahoo Finance → Alpha Vantage → Dados Locais
- Garantia de disponibilidade contínua
- Logs detalhados para debugging

## Configuração de Ambiente

### Variáveis de Ambiente
```bash
# .env
REACT_APP_ALPHA_VANTAGE_API_KEY=sua_chave_aqui
REACT_APP_FRED_API_KEY=sua_chave_aqui
```

### Como Obter as Chaves
1. **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
2. **FRED**: https://fred.stlouisfed.org/docs/api/api_key.html

## Arquitetura Técnica

### Serviços
- `SP500Service`: Serviço principal com lógica de negócio para S&P 500
- `BitcoinService`: Serviço para dados históricos do Bitcoin
- `RealTimeSP500Service`: Integração com APIs externas para dados de 2025
- `financeApis.ts`: Configuração centralizada das APIs

### Componentes
- `MaquinaAlavancagemSP500`: Página principal com seletor de ativos
- Tabela responsiva de retornos mensais (S&P 500 ou Bitcoin)
- Controles de configuração (ativo e anos)
- Estatísticas de performance dinâmicas

### Lógica de Dados
- **S&P 500**: Dados históricos + tempo real para 2025
- **Bitcoin**: Dados históricos de 2014-2024
- **Seleção Dinâmica**: Interface alterna entre os ativos
- **Estatísticas Adaptativas**: Cálculos baseados no ativo selecionado

## Exemplo de Uso

### Carregamento de Dados
```typescript
// Carregar dados históricos
const data = await SP500Service.getHistoricalData(10); // 10 anos

// Carregar dados em tempo real
const realTimeData = await RealTimeSP500Service.getDataFromMultipleSources();

// Verificar status dos dados de 2025
const status = RealTimeSP500Service.get2025DataStatus();
```

### Configuração de Anos
- Interface permite seleção de 5, 10, 15, 20, 25 ou 30 anos
- Dados são filtrados automaticamente
- Performance otimizada para grandes volumes de dados

## Próximos Passos

### ✅ Concluído
- [x] Refatoração completa da página
- [x] Integração com APIs financeiras
- [x] Dados em tempo real
- [x] Lógica de meses fechados para 2025
- [x] Sistema de fallback robusto
- [x] Interface responsiva e moderna

### 🔄 Possíveis Melhorias Futuras
- [ ] Gráficos interativos de performance
- [ ] Comparação com outros índices
- [ ] Alertas de volatilidade
- [ ] Exportação de dados
- [ ] Análise de correlações

## Notas Importantes

### Dados de 2025
- **Regra Principal**: Apenas meses completamente fechados são exibidos
- **Exemplo**: Se estamos em março de 2025, apenas janeiro e fevereiro aparecem
- **Justificativa**: Garantir que os dados sejam reais e não projeções
- **Atualização**: Automática no final de cada mês

### Performance
- Dados são cacheados localmente
- Requisições otimizadas para APIs externas
- Fallback automático em caso de falha
- Logs detalhados para monitoramento

### Segurança
- Chaves de API armazenadas em variáveis de ambiente
- Validação de dados recebidos
- Tratamento de erros robusto
- Sem exposição de credenciais no código

## Troubleshooting

### Problemas Comuns
1. **Dados não carregam**: Verificar conectividade e chaves de API
2. **Dados de 2025 vazios**: Aguardar fechamento do mês atual
3. **Erro de API**: Verificar logs e usar dados de fallback

### Logs Úteis
- Console do navegador para erros de frontend
- Network tab para problemas de API
- Logs do serviço para debugging detalhado

---

**Última Atualização**: Adicionada funcionalidade completa do Bitcoin com tabela idêntica
**Status**: ✅ Funcionando com S&P 500 e Bitcoin
**Versão**: 3.0 - Análise Dupla de Ativos
