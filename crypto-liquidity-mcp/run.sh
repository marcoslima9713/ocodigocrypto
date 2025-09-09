#!/bin/bash

# Script para executar o Crypto Liquidity MCP
# Baseado no CryptoAnalysisMCP por M-Pineapple

echo "🚀 Iniciando Crypto Liquidity MCP..."
echo "📊 Análise de Pools de Liquidez em Múltiplas Redes"
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3.8+"
    exit 1
fi

# Verificar se as dependências estão instaladas
echo "🔍 Verificando dependências..."
if ! python3 -c "import aiohttp, asyncio" &> /dev/null; then
    echo "📦 Instalando dependências..."
    pip3 install -r requirements.txt
fi

# Verificar permissões de execução
if [ ! -x "main.py" ]; then
    echo "🔧 Configurando permissões de execução..."
    chmod +x main.py
fi

echo "✅ Tudo pronto!"
echo ""
echo "🌐 Redes suportadas: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Solana, etc."
echo "🏦 DEXes suportados: Uniswap, SushiSwap, PancakeSwap, QuickSwap, etc."
echo ""
echo "📝 Exemplos de uso:"
echo "  • Buscar pools do Ethereum: get_network_pools (ethereum, tvl, 20)"
echo "  • Buscar pools de USDC: search_pools_by_token (USDC, ethereum)"
echo "  • Listar redes: get_available_networks"
echo ""
echo "🔄 Iniciando servidor MCP..."
echo ""

# Executar o MCP
python3 main.py
