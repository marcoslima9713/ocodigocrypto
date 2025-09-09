@echo off
REM Script para executar o Crypto Liquidity MCP no Windows
REM Baseado no CryptoAnalysisMCP por M-Pineapple

echo 🚀 Iniciando Crypto Liquidity MCP...
echo 📊 Análise de Pools de Liquidez em Múltiplas Redes
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado. Por favor, instale Python 3.8+
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
echo 🔍 Verificando dependências...
python -c "import aiohttp, asyncio" >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando dependências...
    pip install -r requirements.txt
)

echo ✅ Tudo pronto!
echo.
echo 🌐 Redes suportadas: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Solana, etc.
echo 🏦 DEXes suportados: Uniswap, SushiSwap, PancakeSwap, QuickSwap, etc.
echo.
echo 📝 Exemplos de uso:
echo   • Buscar pools do Ethereum: get_network_pools (ethereum, tvl, 20)
echo   • Buscar pools de USDC: search_pools_by_token (USDC, ethereum)
echo   • Listar redes: get_available_networks
echo.
echo 🔄 Iniciando servidor MCP...
echo.

REM Executar o MCP
python main.py

pause
