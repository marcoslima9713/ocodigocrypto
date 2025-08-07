# Integração CoinGecko - Crypto Luxe Portal

## 📋 Visão Geral

Sistema completo de integração com a API CoinGecko para preços de criptomoedas em tempo real, implementado com cache inteligente, retry exponencial e debounce.

## 🏗️ Arquitetura

### Service Layer (`src/services/cryptoPriceService.ts`)
- **API Key**: `CG-3ScWT3LGqP7RxgwHcp9yGVFw`
- **Rate Limit**: 50 req/min (plano free)
- **Cache TTL**: 4 horas
- **Retry**: 3 tentativas com backoff exponencial
- **Debounce**: 500ms para evitar chamadas redundantes

### Tipos (`src/types/crypto.d.ts`)
```typescript
interface CryptoPrice {
  usd: number
  brl: number
  usd_24h_change: number
  // ... outros campos
}

interface PortfolioAsset {
  coinGeckoId: string // ex: 'bitcoin'
  symbol: string // ex: 'BTC'
  // ... outros campos
}
```

### Hooks (`src/hooks/useCryptoPrices.ts`)
- `useCryptoPrices()` - Hook principal
- `usePortfolioPrices()` - Especializado para portfolio
- `useSingleCryptoPrice()` - Para moeda única

## 🚀 Como Usar

### 1. Service Layer Básico

```typescript
import { getRealTimePrices, getCoinGeckoId } from '@/services/cryptoPriceService'

// Buscar preços
const prices = await getRealTimePrices(['bitcoin', 'ethereum'], 'usd,brl')

// Converter symbol para coinGeckoId
const coinGeckoId = getCoinGeckoId('BTC') // retorna 'bitcoin'
```

### 2. Hook Principal

```typescript
import { useCryptoPrices } from '@/hooks/useCryptoPrices'

const MyComponent = () => {
  const {
    prices,
    loading,
    error,
    refetch,
    clearCache,
    cacheStats,
    lastUpdated
  } = useCryptoPrices(['bitcoin', 'ethereum'], {
    refreshInterval: 4 * 60 * 60 * 1000, // 4 horas
    enableAutoRefresh: false, // Desabilitado para evitar atualizações constantes
    currencies: 'usd,brl'
  })

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error}</p>}
      {Object.entries(prices).map(([coinId, price]) => (
        <div key={coinId}>
          {coinId}: ${price.usd}
        </div>
      ))}
    </div>
  )
}
```

### 3. Hook para Portfolio

```typescript
import { usePortfolioPrices } from '@/hooks/useCryptoPrices'

const PortfolioComponent = () => {
  const assets = [
    { coinGeckoId: 'bitcoin' },
    { coinGeckoId: 'ethereum' }
  ]

  const { prices, loading, error } = usePortfolioPrices(assets, {
    refreshInterval: 4 * 60 * 60 * 1000 // 4 horas
  })

  // prices contém preços para 'bitcoin' e 'ethereum'
}
```

### 4. Componente PortfolioManager

```typescript
import { PortfolioManager } from '@/components/PortfolioManager'

const assets = [
  {
    id: '1',
    coinGeckoId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 0.5,
    averagePrice: 45000
  }
]

<PortfolioManager
  assets={assets}
  onAssetUpdate={(asset) => console.log('Atualizado:', asset)}
  onAssetDelete={(assetId) => console.log('Removido:', assetId)}
/>
```

## 🔧 Funcionalidades

### Cache Inteligente
- **TTL**: 4 horas
- **Fallback**: Dados expirados se API falhar
- **Chave**: Baseada em coinIds + currencies
- **Limpeza**: Função `clearPriceCache()`

### Mapeamento Automático
```typescript
// Symbol → CoinGeckoId
'BTC' → 'bitcoin'
'ETH' → 'ethereum'
'ADA' → 'cardano'
// ... mais de 20 mapeamentos
```

### Retry Exponencial
- **Tentativas**: 3
- **Delay inicial**: 1 segundo
- **Backoff**: 2^n (1s, 2s, 4s)

### Debounce
- **Delay**: 500ms
- **Evita**: Chamadas redundantes
- **Aplicado**: Em hooks e service

## 📊 Monitoramento

### Cache Stats
```typescript
const { cacheStats } = useCryptoPrices(['bitcoin'])

console.log(cacheStats)
// {
//   size: 1,
//   entries: ['bitcoin_usd,brl']
// }
```

### Status de Atualização
```typescript
const { lastUpdated, loading, error } = useCryptoPrices(['bitcoin'])

if (lastUpdated) {
  console.log('Última atualização:', lastUpdated.toLocaleTimeString())
}
```

## 🛠️ Configuração

### Variáveis de Ambiente
```env
# CoinGecko API Key (já configurada no service)
COINGECKO_API_KEY=CG-3ScWT3LGqP7RxgwHcp9yGVFw
```

### Rate Limiting
- **Limite**: 50 req/min
- **Estratégia**: Cache + debounce
- **Monitoramento**: Console logs

## 🔄 Atualizações Automáticas

### Portfolio
- **Intervalo**: 4 horas
- **Trigger**: Manual ou mudança de assets
- **Cleanup**: Ao desmontar componente

### Preços Individuais
- **Intervalo**: 4 horas
- **Uso**: Para moedas específicas
- **Otimização**: Atualização manual quando necessário

## 🎯 Exemplo Completo

```typescript
import React, { useState } from 'react'
import { usePortfolioPrices } from '@/hooks/useCryptoPrices'
import { PortfolioManager } from '@/components/PortfolioManager'

const MyPortfolio = () => {
  const [assets, setAssets] = useState([
    {
      id: '1',
      coinGeckoId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 0.5,
      averagePrice: 45000
    }
  ])

  const { prices, loading, error, refetch } = usePortfolioPrices(assets)

  return (
    <div>
      {loading && <p>🔄 Atualizando preços...</p>}
      {error && <p>❌ Erro: {error}</p>}
      
      <PortfolioManager
        assets={assets}
        onAssetUpdate={(asset) => {
          setAssets(prev => 
            prev.map(a => a.id === asset.id ? asset : a)
          )
        }}
        onAssetDelete={(assetId) => {
          setAssets(prev => prev.filter(a => a.id !== assetId))
        }}
      />
    </div>
  )
}
```

## 📈 Métricas de Performance

### Cache Hit Rate
- **Objetivo**: >95% (com TTL de 4 horas)
- **Monitoramento**: Console logs
- **Otimização**: TTL ajustável

### API Calls
- **Máximo**: 50/min
- **Estratégia**: Cache + debounce
- **Fallback**: Dados expirados

### Response Time
- **Cache**: <10ms
- **API**: <2s
- **Timeout**: 10s

## 🔒 Segurança

### API Key
- **Localização**: Service layer
- **Exposição**: Não exposta no frontend
- **Rate Limit**: Respeitado

### Validação
- **Input**: CoinGeckoIds válidos
- **Output**: Tipos TypeScript
- **Error Handling**: Try/catch completo

## 🚨 Troubleshooting

### Erro 429 (Rate Limit)
```typescript
// Solução: Aumentar cache TTL
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos
```

### Erro 500 (API Indisponível)
```typescript
// Fallback automático para dados expirados
if (cached && !isCacheValid(cached.timestamp)) {
  return cached.data // Dados expirados como fallback
}
```

### Cache Não Funcionando
```typescript
// Debug cache
const { cacheStats } = useCryptoPrices(['bitcoin'])
console.log('Cache stats:', cacheStats)
```

## 📝 Logs

### Console Output
```
🔄 Buscando preços em tempo real: ['bitcoin', 'ethereum']
✅ Preços atualizados com sucesso
📦 Usando dados do cache
⚠️ Usando dados expirados do cache como fallback
❌ Erro ao buscar preços: CoinGecko API error: 429
```

## 🎯 Próximos Passos

1. **WebSocket**: Para atualizações em tempo real
2. **Histórico**: Armazenar histórico de preços
3. **Alertas**: Notificações de preço
4. **Gráficos**: Integração com bibliotecas de gráficos
5. **Backtesting**: Simulação de estratégias

---

**Desenvolvido para Crypto Luxe Portal**  
**API CoinGecko v3**  
**Rate Limit: 50 req/min** 