# Crypto Financial MCP Server

Servidor MCP (Model Context Protocol) para dados financeiros do Bitcoin usando a API Financial Datasets.

## 🚀 Funcionalidades

- **Preço Atual do Bitcoin**: Obter preço, volume, market cap e variações
- **Dados Históricos**: Preços históricos para análise de tendências
- **Retornos Mensais**: Cálculo automático de retornos mensais para análise de performance
- **Cache Inteligente**: Cache de 5 minutos para otimizar performance
- **Fallback**: Dados mockados quando a API não está disponível

## 📋 Pré-requisitos

- Python 3.8 ou superior
- Chave da API Financial Datasets

## 🔧 Instalação

### 1. Clone o repositório
```bash
cd crypto-financial-mcp
```

### 2. Configure a API Key
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e adicione sua API key
# FINANCIAL_DATASETS_API_KEY=sua-chave-aqui
```

### 3. Execute o servidor

**Windows:**
```bash
run.bat
```

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

## 🛠️ Ferramentas Disponíveis

### 1. get_current_bitcoin_price
Obtém o preço atual do Bitcoin e dados de mercado.

**Parâmetros:** Nenhum

**Exemplo de resposta:**
```
₿ Preço Atual do Bitcoin

💰 Preço: $43,250.50
📊 Volume 24h: $28,450,000,000
🏦 Market Cap: $850,000,000,000
📈 Variação 24h: +2.45%
📅 Variação 7d: +8.32%
📆 Variação 30d: +15.67%
🕐 Data: 2024-01-15
```

### 2. get_historical_bitcoin_prices
Obtém preços históricos do Bitcoin para um período específico.

**Parâmetros:**
- `start_date` (string): Data inicial no formato YYYY-MM-DD
- `end_date` (string): Data final no formato YYYY-MM-DD

**Exemplo:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_historical_bitcoin_prices",
    "arguments": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

### 3. get_bitcoin_monthly_returns
Obtém retornos mensais do Bitcoin para análise de performance.

**Parâmetros:**
- `years` (integer): Número de anos para analisar (padrão: 10)

**Exemplo:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_bitcoin_monthly_returns",
    "arguments": {
      "years": 5
    }
  }
}
```

## 📊 Dados de Exemplo

O servidor inclui dados mockados realistas baseados em dados históricos reais do Bitcoin:

- **Retornos mensais**: Baseados em dados históricos de 2014-2024
- **Preços**: Simulação realista de preços de mercado
- **Volumes**: Volumes de trading baseados em dados reais
- **Variações**: Flutuações típicas do mercado de cripto

## 🔄 Cache e Performance

- **Cache**: 5 minutos para otimizar performance
- **Timeout**: 30 segundos para requisições de API
- **Fallback**: Dados mockados quando a API falha
- **Retry**: Tentativas automáticas em caso de erro

## 🚨 Tratamento de Erros

- **API Indisponível**: Retorna dados mockados
- **Chave Inválida**: Log de erro e fallback
- **Timeout**: Retry automático
- **Dados Inválidos**: Validação e sanitização

## 📈 Integração com Frontend

Este MCP foi projetado para integrar com o serviço `bitcoinService.ts` do frontend, substituindo os dados hardcoded por dados reais da API Financial Datasets.

### Estrutura de Dados

```typescript
interface BitcoinHistoricalData {
  year: number;
  month: number;
  return_percentage: number;
  price_start: number;
  price_end: number;
  volume_avg: number;
}
```

## 🔗 API Financial Datasets

- **Website**: https://www.financialdatasets.ai/
- **Documentação**: https://docs.financialdatasets.ai/
- **Limite**: Varia por plano
- **Suporte**: Criptomoedas, ações, commodities

## 📝 Logs

O servidor gera logs detalhados para debugging:

```
INFO:__main__:Starting Crypto Financial MCP Server...
INFO:__main__:Fetching current Bitcoin price...
INFO:__main__:Cache hit for bitcoin_monthly_returns_10
WARNING:__main__:Financial Datasets API returned status 429
ERROR:__main__:Error fetching historical Bitcoin prices: Connection timeout
```

## 🎯 Próximos Passos

1. **Integração com Frontend**: Atualizar `bitcoinService.ts`
2. **Testes**: Implementar testes unitários
3. **Monitoramento**: Adicionar métricas de performance
4. **Alertas**: Notificações para mudanças significativas
5. **Histórico**: Armazenamento de dados históricos

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique os logs do servidor
2. Confirme se a API key está correta
3. Teste a conectividade com a API
4. Verifique se o Python está atualizado

---

**Implementação concluída! 🎉**

O servidor MCP está pronto para fornecer dados reais do Bitcoin para a página da máquina de alavancagem.
