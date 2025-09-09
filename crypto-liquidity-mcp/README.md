# Crypto Liquidity MCP

Model Context Protocol (MCP) para análise de pools de liquidez em múltiplas redes blockchain.

## 🚀 Funcionalidades

- **Análise de Pools de Liquidez**: Dados de TVL, volume, APY e taxas
- **Múltiplas Redes**: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Solana, etc.
- **Comparação de DEXes**: Uniswap, SushiSwap, PancakeSwap, QuickSwap, etc.
- **Busca por Token**: Encontre pools específicos por símbolo do token
- **Score de Oportunidade**: Algoritmo para identificar as melhores oportunidades
- **Cache Inteligente**: Otimização de performance com cache de 5 minutos

## 📦 Instalação

1. **Instalar dependências Python**:
```bash
cd crypto-liquidity-mcp
pip install -r requirements.txt
```

2. **Configurar permissões de execução**:
```bash
chmod +x main.py
```

3. **Testar o MCP**:
```bash
python main.py
```

## 🔧 Configuração

### Variáveis de Ambiente (Opcional)

```bash
# Configurar timeout de cache (em segundos)
export CACHE_TIMEOUT=300

# Configurar timeout de requisições (em segundos)
export REQUEST_TIMEOUT=30
```

## 📊 APIs Utilizadas

### DexScreener API
- **Endpoint**: `https://api.dexscreener.com/latest/dex/tokens/{network}`
- **Limite**: Sem limite para uso básico
- **Dados**: Pools de liquidez, volumes, preços

### CoinGecko API
- **Endpoint**: `https://api.coingecko.com/api/v3/dex/tokens/{network}`
- **Limite**: 50 calls/minuto (gratuito)
- **Dados**: Dados complementares de pools

## 🛠️ Comandos Disponíveis

### 1. get_network_pools
Obtém pools de liquidez para uma rede específica.

```json
{
  "network": "ethereum",
  "sort_by": "tvl",
  "limit": 20
}
```

**Parâmetros**:
- `network`: Nome da rede (ethereum, bsc, polygon, etc.)
- `sort_by`: Critério de ordenação (tvl, apy, volume_usd, fees_24h)
- `limit`: Número máximo de pools (padrão: 20)

### 2. get_available_networks
Lista todas as redes disponíveis com estatísticas.

```json
{}
```

### 3. search_pools_by_token
Busca pools que contêm um token específico.

```json
{
  "token_symbol": "USDC",
  "network": "ethereum"
}
```

**Parâmetros**:
- `token_symbol`: Símbolo do token (obrigatório)
- `network`: Nome da rede (opcional, padrão: ethereum)

### 4. get_pool_comparison
Compara pools de diferentes DEXes para um token.

```json
{
  "token_symbol": "ETH",
  "network": "ethereum"
}
```

## 📈 Redes Suportadas

| Rede | Chain ID | Status |
|------|----------|--------|
| Ethereum | 1 | ✅ |
| BSC | 56 | ✅ |
| Polygon | 137 | ✅ |
| Arbitrum | 42161 | ✅ |
| Optimism | 10 | ✅ |
| Base | 8453 | ✅ |
| Solana | - | ✅ |
| Avalanche | 43114 | ✅ |
| Fantom | 250 | ✅ |
| Aptos | - | ✅ |
| Sui | - | ✅ |

## 🏦 DEXes Suportados

- **Uniswap V3** 🦄
- **SushiSwap** 🍣
- **PancakeSwap** 🥞
- **QuickSwap** ⚡
- **Camelot** 🐪
- **TraderJoe** 👨‍💼
- **Raydium** ☀️
- **Orca** 🐋

## 📊 Estrutura de Dados

### LiquidityPool
```typescript
interface LiquidityPool {
  network: string;
  dex: string;
  token0: string;
  token1: string;
  token0_symbol: string;
  token1_symbol: string;
  liquidity_usd: number;
  volume_24h: number;
  fees_24h: number;
  apy: number;
  tvl: number;
  price_change_24h: number;
  pool_address: string;
  pair_address: string;
}
```

### NetworkInfo
```typescript
interface NetworkInfo {
  name: string;
  chain_id: number;
  tvl: number;
  pool_count: number;
  volume_24h: number;
}
```

## 🎯 Score de Oportunidade

O algoritmo calcula um score baseado em:

- **TVL (30 pontos)**: Liquidez total do pool
- **Volume 24h (25 pontos)**: Volume de trading
- **APY (25 pontos)**: Retorno anual percentual
- **Taxas 24h (20 pontos)**: Taxas geradas

**Classificação de Risco**:
- **LOW**: Score ≥ 70
- **MEDIUM**: Score ≥ 40
- **HIGH**: Score < 40

## 🔄 Cache

- **Timeout**: 5 minutos
- **Chave**: Combinação de parâmetros da requisição
- **Armazenamento**: Memória local

## 🚨 Tratamento de Erros

- **Fallback**: Dados mockados em caso de falha da API
- **Retry**: Tentativas automáticas para requisições falhadas
- **Logging**: Logs detalhados para debugging

## 📝 Exemplos de Uso

### Buscar Top Pools do Ethereum
```bash
echo '{"method":"tools/call","params":{"name":"get_network_pools","arguments":{"network":"ethereum","sort_by":"tvl","limit":10}}}' | python main.py
```

### Buscar Pools de USDC
```bash
echo '{"method":"tools/call","params":{"name":"search_pools_by_token","arguments":{"token_symbol":"USDC","network":"ethereum"}}}' | python main.py
```

### Listar Redes Disponíveis
```bash
echo '{"method":"tools/call","params":{"name":"get_available_networks","arguments":{}}}' | python main.py
```

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
crypto-liquidity-mcp/
├── main.py                 # Servidor MCP principal
├── requirements.txt        # Dependências Python
└── README.md              # Este arquivo
```

### Adicionando Novas Redes

1. Adicionar na lista de redes em `get_available_networks()`
2. Mapear para CoinGecko ID em `get_gecko_data()`
3. Testar com dados reais

### Adicionando Novos DEXes

1. Atualizar ícones em `getDexIcon()` no frontend
2. Verificar compatibilidade com APIs
3. Testar parsing de dados

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para questões, bugs ou sugestões:

1. Abra uma issue no GitHub
2. Descreva o problema detalhadamente
3. Inclua logs de erro se aplicável

---

**Desenvolvido com ❤️ para a comunidade DeFi**
