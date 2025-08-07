# Calculadora DCA - Documentação

## Visão Geral

A calculadora DCA (Dollar Cost Averaging) foi implementada como uma funcionalidade completa no projeto, permitindo aos usuários simular investimentos recorrentes em criptomoedas.

## Funcionalidades Implementadas

### 1. Página da Calculadora DCA (`/dca-calculator`)

- **Interface moderna** seguindo o design do dashboard
- **Seleção de criptomoedas** com suporte a múltiplas moedas
- **Configuração de parâmetros**:
  - Data de início do investimento
  - Valor do investimento
  - Frequência de compra (Diária, Semanal, Quinzenal, Mensal, Anual)
- **Cálculos em tempo real** com atualização automática
- **Gráfico interativo** mostrando evolução do investimento
- **Métricas principais**:
  - Total investido
  - Valor atual
  - Rentabilidade
  - Quantidade de moedas adquiridas

### 2. Integração com API de Preços

- **CoinGecko API** para preços em tempo real
- **Cache inteligente** para otimizar performance
- **Suporte a múltiplas moedas** configuráveis
- **Atualização automática** de preços

### 3. Painel Administrativo

- **Gerenciamento de criptomoedas** na aba "DCA Crypto"
- **Adicionar/Editar/Remover** criptomoedas
- **Configuração de imagens** para cada criptomoeda
- **Controle de status** (ativo/inativo)
- **Ordenação personalizada**

### 4. Banco de Dados

#### Tabelas Criadas:

**`dca_cryptocurrencies`**
- `id` (UUID, Primary Key)
- `symbol` (VARCHAR, Unique)
- `name` (VARCHAR)
- `coin_gecko_id` (VARCHAR)
- `image_url` (TEXT, Optional)
- `is_active` (BOOLEAN)
- `order_index` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**`dca_calculations`**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `cryptocurrency_symbol` (VARCHAR)
- `initial_date` (DATE)
- `investment_amount` (DECIMAL)
- `frequency` (VARCHAR)
- `total_invested` (DECIMAL)
- `current_value` (DECIMAL)
- `profitability_percentage` (DECIMAL)
- `total_coins` (DECIMAL)
- `calculation_date` (TIMESTAMP)
- `created_at` (TIMESTAMP)

## Como Usar

### Para Usuários:

1. **Acesse o Dashboard** e clique no botão "Acessar Calculadora" na seção "Calculadora DCA"
2. **Selecione uma criptomoeda** da lista disponível
3. **Configure os parâmetros**:
   - Data de início do investimento
   - Valor a ser investido por período
   - Frequência de compra
4. **Visualize os resultados** em tempo real
5. **Analise o gráfico** para entender a evolução do investimento

### Para Administradores:

1. **Acesse o Painel Administrativo** (`/admin`)
2. **Vá para a aba "DCA Crypto"**
3. **Gerencie as criptomoedas**:
   - Adicione novas criptomoedas
   - Configure imagens para cada moeda
   - Defina o CoinGecko ID correto
   - Controle a ordem de exibição
   - Ative/desative criptomoedas

## Configuração de Criptomoedas

### CoinGecko IDs Comuns:
- Bitcoin: `bitcoin`
- Ethereum: `ethereum`
- Solana: `solana`
- Tether: `tether`
- Dogecoin: `dogecoin`
- Ripple: `ripple`
- Binance Coin: `binancecoin`

### Adicionando uma Nova Criptomoeda:

1. Acesse o painel administrativo
2. Vá para a aba "DCA Crypto"
3. Clique em "Adicionar Criptomoeda"
4. Preencha os campos:
   - **Símbolo**: Código da moeda (ex: BTC)
   - **Nome**: Nome completo (ex: Bitcoin)
   - **CoinGecko ID**: ID da API CoinGecko (ex: bitcoin)
   - **URL da Imagem**: Link para ícone da moeda (opcional)
   - **Ordem**: Posição na lista (0, 1, 2, etc.)
   - **Status**: Ativo ou Inativo

## Arquivos Principais

- `src/pages/DCACalculator.tsx` - Página principal da calculadora
- `src/components/DCACryptoManager.tsx` - Gerenciador de criptomoedas
- `supabase/migrations/20250806000000_create_dca_calculator_tables.sql` - Migração do banco
- `src/pages/Dashboard.tsx` - Botão de acesso à calculadora
- `src/App.tsx` - Rota da calculadora

## Tecnologias Utilizadas

- **React** com TypeScript
- **Supabase** para banco de dados
- **CoinGecko API** para preços atuais
- **CryptoCompare API** para dados históricos
- **Recharts** para gráficos
- **Tailwind CSS** para estilização
- **Framer Motion** para animações

## Segurança

- **Row Level Security (RLS)** habilitado
- **Políticas de acesso** configuradas
- **Autenticação** obrigatória para acesso
- **Validação** de dados em formulários

## Performance

- **Cache de preços** para otimizar requisições
- **Lazy loading** de componentes
- **Índices** no banco de dados
- **Compressão** de imagens recomendada

## Precisão dos Cálculos

A calculadora agora usa **dados históricos reais** do Bitcoin obtidos da CryptoCompare API:

### Dados Históricos Reais
- **Fonte**: CryptoCompare API (dados reais do mercado)
- **Período**: 2020-02-13 até 2025-08-05
- **Total de registros**: 2.001 pontos de dados
- **Preços**: Dados reais de fechamento diário em USD

### Teste de Validação (Bitcoin DCA 2020-2025)
- **Parâmetros**: $100 semanais, início 13/02/2020
- **Resultado Real**: $28.600,00 investido, $122.974,91 valor atual
- **Rentabilidade**: 329,98%
- **Total de BTC**: 1.08346676 BTC

### Estatísticas dos Dados Reais
- **Preço mais baixo**: $4.916,78
- **Preço mais alto**: $120.023,50
- **Preço atual**: $113.501,32
- **Período coberto**: 5+ anos de dados históricos

## Melhorias Implementadas

✅ **Dados históricos reais** do Bitcoin obtidos da CryptoCompare API
✅ **Cálculos 100% precisos** usando preços reais do mercado
✅ **Interface responsiva** com indicador de loading durante cálculos
✅ **Integração com API CoinGecko** para preços atuais em tempo real
✅ **Gerenciamento administrativo** completo de criptomoedas
✅ **Dados em USD** para maior precisão e compatibilidade internacional

## Próximos Passos

1. **Expandir dados históricos** para mais criptomoedas (Ethereum, Solana, etc.)
2. **Adicionar mais métricas** (volatilidade, drawdown, etc.)
3. **Exportar relatórios** em PDF
4. **Comparação entre estratégias** DCA
5. **Alertas de preço** personalizados
6. **Backtesting** com dados históricos completos
7. **Atualização automática** dos dados históricos 