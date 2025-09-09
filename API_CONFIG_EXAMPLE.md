# Configuração das APIs Financeiras

## Variáveis de Ambiente (Opcionais)

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# Alpha Vantage API Key (opcional - para fallback)
# Obtenha sua chave gratuita em: https://www.alphavantage.co/support/#api-key
# Limite: 5 chamadas por minuto, 500 por dia (free tier)
REACT_APP_ALPHA_VANTAGE_API_KEY=sua_chave_aqui

# FRED API Key (opcional - para dados econômicos)
# Obtenha sua chave gratuita em: https://fred.stlouisfed.org/docs/api/api_key.html
# Limite: 120 chamadas por minuto
REACT_APP_FRED_API_KEY=sua_chave_aqui

# Modo Debug (opcional)
# Ativa logs detalhados para desenvolvimento
REACT_APP_DEBUG=false
```

## Como Obter API Keys

### 1. Alpha Vantage
1. Acesse: https://www.alphavantage.co/support/#api-key
2. Preencha o formulário com seu email
3. Receba a chave gratuita por email
4. Limite: 5 chamadas por minuto, 500 por dia

### 2. FRED (Federal Reserve)
1. Acesse: https://fred.stlouisfed.org/docs/api/api_key.html
2. Clique em "Request API Key"
3. Preencha o formulário
4. Receba a chave gratuita por email
5. Limite: 120 chamadas por minuto

## Notas Importantes

- **Yahoo Finance não requer API key** e é usado como fonte principal
- As outras APIs são usadas como **fallback** para garantir disponibilidade
- **Sem configuração**: O sistema funciona perfeitamente com Yahoo Finance
- **Com configuração**: Sistema mais robusto com múltiplas fontes de dados

## Estrutura de Fallback

1. **Yahoo Finance** (principal) - Sempre disponível
2. **Alpha Vantage** (fallback 1) - Se configurado
3. **FRED** (fallback 2) - Se configurado
4. **Dados de fallback** (último recurso) - Sempre disponível

## Testando as APIs

Após configurar as variáveis de ambiente:

1. Reinicie o servidor de desenvolvimento
2. Acesse a Máquina de Alavancagem
3. Verifique o console para logs de conectividade
4. Os dados de 2025 devem carregar em tempo real
