#!/usr/bin/env python3
"""
Crypto Liquidity MCP - Model Context Protocol server for liquidity pool analysis
Based on CryptoAnalysisMCP by M-Pineapple
"""

import asyncio
import json
import logging
import sys
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
import aiohttp
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LiquidityPool:
    """Data class for liquidity pool information"""
    network: str
    dex: str
    token0: str
    token1: str
    token0_symbol: str
    token1_symbol: str
    liquidity_usd: float
    volume_24h: float
    fees_24h: float
    apy: float
    tvl: float
    price_change_24h: float
    pool_address: str
    pair_address: str

@dataclass
class NetworkInfo:
    """Data class for network information"""
    name: str
    chain_id: int
    tvl: float
    pool_count: int
    volume_24h: float

class LiquidityDataProvider:
    """Provider for liquidity pool data from multiple sources"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_dexscreener_data(self, network: str = "ethereum") -> List[Dict]:
        """Get liquidity pool data from DexScreener API"""
        if not self.session:
            return []
            
        try:
            url = f"https://api.dexscreener.com/latest/dex/tokens/{network}"
            async with self.session.get(url, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('pairs', [])
                else:
                    logger.warning(f"DexScreener API returned status {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching DexScreener data: {e}")
            return []
    
    async def get_gecko_data(self, network: str = "ethereum") -> List[Dict]:
        """Get liquidity pool data from CoinGecko API"""
        if not self.session:
            return []
            
        try:
            # Map network names to CoinGecko IDs
            network_map = {
                "ethereum": "ethereum",
                "bsc": "binance-smart-chain",
                "polygon": "polygon-pos",
                "arbitrum": "arbitrum-one",
                "optimism": "optimistic-ethereum",
                "base": "base",
                "solana": "solana",
                "avalanche": "avalanche",
                "fantom": "fantom",
                "aptos": "aptos",
                "sui": "sui"
            }
            
            gecko_id = network_map.get(network, network)
            url = f"https://api.coingecko.com/api/v3/dex/tokens/{gecko_id}"
            
            async with self.session.get(url, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('pairs', [])
                else:
                    logger.warning(f"CoinGecko API returned status {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching CoinGecko data: {e}")
            return []
    
    def parse_pool_data(self, raw_data: List[Dict], network: str) -> List[LiquidityPool]:
        """Parse raw API data into LiquidityPool objects"""
        pools = []
        
        for item in raw_data:
            try:
                # Extract basic info
                token0 = item.get('baseToken', {}).get('address', '')
                token1 = item.get('quoteToken', {}).get('address', '')
                token0_symbol = item.get('baseToken', {}).get('symbol', '')
                token1_symbol = item.get('quoteToken', {}).get('symbol', '')
                
                # Extract liquidity and volume data
                liquidity_usd = float(item.get('liquidity', {}).get('usd', 0))
                volume_24h = float(item.get('volume', {}).get('h24', 0))
                fees_24h = float(item.get('fees', {}).get('h24', 0))
                
                # Calculate APY (simplified)
                apy = 0
                if liquidity_usd > 0 and fees_24h > 0:
                    daily_fee_rate = fees_24h / liquidity_usd
                    apy = daily_fee_rate * 365 * 100
                
                # Extract other metrics
                tvl = liquidity_usd
                price_change_24h = float(item.get('priceChange', {}).get('h24', 0))
                pool_address = item.get('pairAddress', '')
                pair_address = item.get('pairAddress', '')
                
                # Get DEX name
                dex = item.get('dexId', 'Unknown')
                
                pool = LiquidityPool(
                    network=network,
                    dex=dex,
                    token0=token0,
                    token1=token1,
                    token0_symbol=token0_symbol,
                    token1_symbol=token1_symbol,
                    liquidity_usd=liquidity_usd,
                    volume_24h=volume_24h,
                    fees_24h=fees_24h,
                    apy=apy,
                    tvl=tvl,
                    price_change_24h=price_change_24h,
                    pool_address=pool_address,
                    pair_address=pair_address
                )
                
                pools.append(pool)
                
            except Exception as e:
                logger.warning(f"Error parsing pool data: {e}")
                continue
        
        return pools
    
    async def get_network_pools(self, network: str, sort_by: str = "tvl", limit: int = 50) -> List[LiquidityPool]:
        """Get liquidity pools for a specific network"""
        cache_key = f"{network}_{sort_by}_{limit}"
        
        # Check cache
        if cache_key in self.cache:
            cache_time, cached_data = self.cache[cache_key]
            if time.time() - cache_time < self.cache_timeout:
                return cached_data
        
        # Fetch data from multiple sources
        dexscreener_data = await self.get_dexscreener_data(network)
        gecko_data = await self.get_gecko_data(network)
        
        # Combine and parse data
        all_data = dexscreener_data + gecko_data
        pools = self.parse_pool_data(all_data, network)
        
        # Sort pools
        if sort_by == "tvl":
            pools.sort(key=lambda x: x.tvl, reverse=True)
        elif sort_by == "volume_usd":
            pools.sort(key=lambda x: x.volume_24h, reverse=True)
        elif sort_by == "apy":
            pools.sort(key=lambda x: x.apy, reverse=True)
        elif sort_by == "fees_24h":
            pools.sort(key=lambda x: x.fees_24h, reverse=True)
        
        # Apply limit
        pools = pools[:limit]
        
        # Cache results
        self.cache[cache_key] = (time.time(), pools)
        
        return pools
    
    async def get_available_networks(self) -> List[NetworkInfo]:
        """Get list of available networks with basic stats"""
        networks = [
            NetworkInfo("ethereum", 1, 0, 0, 0),
            NetworkInfo("bsc", 56, 0, 0, 0),
            NetworkInfo("polygon", 137, 0, 0, 0),
            NetworkInfo("arbitrum", 42161, 0, 0, 0),
            NetworkInfo("optimism", 10, 0, 0, 0),
            NetworkInfo("base", 8453, 0, 0, 0),
            NetworkInfo("solana", 0, 0, 0, 0),
            NetworkInfo("avalanche", 43114, 0, 0, 0),
            NetworkInfo("fantom", 250, 0, 0, 0),
            NetworkInfo("aptos", 0, 0, 0, 0),
            NetworkInfo("sui", 0, 0, 0, 0)
        ]
        
        # Try to get basic stats for each network
        for network in networks:
            try:
                pools = await self.get_network_pools(network.name, limit=10)
                if pools:
                    network.tvl = sum(p.tvl for p in pools)
                    network.pool_count = len(pools)
                    network.volume_24h = sum(p.volume_24h for p in pools)
            except Exception as e:
                logger.warning(f"Error getting stats for {network.name}: {e}")
        
        return networks
    
    async def search_pools_by_token(self, token_symbol: str, network: str = "ethereum") -> List[LiquidityPool]:
        """Search for pools containing a specific token"""
        pools = await self.get_network_pools(network, limit=100)
        
        # Filter pools containing the token
        matching_pools = []
        token_symbol_upper = token_symbol.upper()
        
        for pool in pools:
            if (token_symbol_upper in pool.token0_symbol.upper() or 
                token_symbol_upper in pool.token1_symbol.upper()):
                matching_pools.append(pool)
        
        return matching_pools
    
    async def get_pool_comparison(self, token_symbol: str, network: str = "ethereum") -> Dict:
        """Compare pools across different DEXes for a token"""
        pools = await self.search_pools_by_token(token_symbol, network)
        
        # Group by DEX
        dex_pools = {}
        for pool in pools:
            if pool.dex not in dex_pools:
                dex_pools[pool.dex] = []
            dex_pools[pool.dex].append(pool)
        
        # Find best pools per DEX
        comparison = {}
        for dex, dex_pools_list in dex_pools.items():
            if dex_pools_list:
                best_pool = max(dex_pools_list, key=lambda x: x.tvl)
                comparison[dex] = {
                    "best_pool": best_pool,
                    "total_pools": len(dex_pools_list),
                    "total_tvl": sum(p.tvl for p in dex_pools_list),
                    "total_volume": sum(p.volume_24h for p in dex_pools_list)
                }
        
        return comparison

class LiquidityMCPServer:
    """MCP Server for liquidity pool analysis"""
    
    def __init__(self):
        self.provider = LiquidityDataProvider()
    
    async def handle_request(self, request: Dict) -> Dict:
        """Handle incoming MCP requests"""
        method = request.get("method")
        params = request.get("params", {})
        
        try:
            if method == "tools/list":
                return await self.list_tools()
            elif method == "tools/call":
                return await self.call_tool(params)
            else:
                return {"error": {"code": -32601, "message": f"Method {method} not found"}}
        except Exception as e:
            logger.error(f"Error handling request: {e}")
            return {"error": {"code": -32603, "message": str(e)}}
    
    async def list_tools(self) -> Dict:
        """List available tools"""
        return {
            "result": {
                "tools": [
                    {
                        "name": "get_network_pools",
                        "description": "Get liquidity pools for a specific network",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "network": {
                                    "type": "string",
                                    "description": "Network name (ethereum, bsc, polygon, etc.)",
                                    "default": "ethereum"
                                },
                                "sort_by": {
                                    "type": "string",
                                    "description": "Sort by: tvl, volume_usd, apy, fees_24h",
                                    "default": "tvl"
                                },
                                "limit": {
                                    "type": "integer",
                                    "description": "Number of pools to return",
                                    "default": 20
                                }
                            }
                        }
                    },
                    {
                        "name": "get_available_networks",
                        "description": "Get list of available networks with basic stats",
                        "inputSchema": {
                            "type": "object",
                            "properties": {}
                        }
                    },
                    {
                        "name": "search_pools_by_token",
                        "description": "Search for pools containing a specific token",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "token_symbol": {
                                    "type": "string",
                                    "description": "Token symbol to search for"
                                },
                                "network": {
                                    "type": "string",
                                    "description": "Network name",
                                    "default": "ethereum"
                                }
                            },
                            "required": ["token_symbol"]
                        }
                    },
                    {
                        "name": "get_pool_comparison",
                        "description": "Compare pools across different DEXes for a token",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "token_symbol": {
                                    "type": "string",
                                    "description": "Token symbol to compare"
                                },
                                "network": {
                                    "type": "string",
                                    "description": "Network name",
                                    "default": "ethereum"
                                }
                            },
                            "required": ["token_symbol"]
                        }
                    }
                ]
            }
        }
    
    async def call_tool(self, params: Dict) -> Dict:
        """Call a specific tool"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        async with self.provider as provider:
            if tool_name == "get_network_pools":
                network = arguments.get("network", "ethereum")
                sort_by = arguments.get("sort_by", "tvl")
                limit = arguments.get("limit", 20)
                
                pools = await provider.get_network_pools(network, sort_by, limit)
                
                return {
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": self.format_pools_response(pools, network, sort_by)
                            }
                        ]
                    }
                }
            
            elif tool_name == "get_available_networks":
                networks = await provider.get_available_networks()
                
                return {
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": self.format_networks_response(networks)
                            }
                        ]
                    }
                }
            
            elif tool_name == "search_pools_by_token":
                token_symbol = arguments.get("token_symbol")
                network = arguments.get("network", "ethereum")
                
                pools = await provider.search_pools_by_token(token_symbol, network)
                
                return {
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": self.format_token_search_response(pools, token_symbol, network)
                            }
                        ]
                    }
                }
            
            elif tool_name == "get_pool_comparison":
                token_symbol = arguments.get("token_symbol")
                network = arguments.get("network", "ethereum")
                
                comparison = await provider.get_pool_comparison(token_symbol, network)
                
                return {
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": self.format_comparison_response(comparison, token_symbol, network)
                            }
                        ]
                    }
                }
            
            else:
                return {"error": {"code": -32601, "message": f"Tool {tool_name} not found"}}
    
    def format_pools_response(self, pools: List[LiquidityPool], network: str, sort_by: str) -> str:
        """Format pools response as text"""
        if not pools:
            return f"Nenhum pool de liquidez encontrado para {network}."
        
        result = f"🏊 **Pools de Liquidez - {network.upper()}** (Ordenado por {sort_by})\n\n"
        
        for i, pool in enumerate(pools[:20], 1):
            result += f"**{i}. {pool.token0_symbol}/{pool.token1_symbol}** ({pool.dex})\n"
            result += f"   💰 TVL: ${pool.tvl:,.0f}\n"
            result += f"   📊 Volume 24h: ${pool.volume_24h:,.0f}\n"
            result += f"   💸 Taxas 24h: ${pool.fees_24h:,.2f}\n"
            result += f"   📈 APY: {pool.apy:.2f}%\n"
            result += f"   📉 Variação 24h: {pool.price_change_24h:+.2f}%\n"
            result += f"   🔗 Pool: {pool.pool_address[:10]}...\n\n"
        
        return result
    
    def format_networks_response(self, networks: List[NetworkInfo]) -> str:
        """Format networks response as text"""
        result = "🌐 **Redes Disponíveis para Análise de Liquidez**\n\n"
        
        for network in networks:
            result += f"**{network.name.upper()}**\n"
            result += f"   🔗 Chain ID: {network.chain_id}\n"
            result += f"   💰 TVL Total: ${network.tvl:,.0f}\n"
            result += f"   🏊 Pools: {network.pool_count}\n"
            result += f"   📊 Volume 24h: ${network.volume_24h:,.0f}\n\n"
        
        return result
    
    def format_token_search_response(self, pools: List[LiquidityPool], token_symbol: str, network: str) -> str:
        """Format token search response as text"""
        if not pools:
            return f"Nenhum pool encontrado para {token_symbol} em {network}."
        
        result = f"🔍 **Pools para {token_symbol} em {network.upper()}**\n\n"
        
        for i, pool in enumerate(pools[:10], 1):
            result += f"**{i}. {pool.token0_symbol}/{pool.token1_symbol}** ({pool.dex})\n"
            result += f"   💰 TVL: ${pool.tvl:,.0f}\n"
            result += f"   📊 Volume 24h: ${pool.volume_24h:,.0f}\n"
            result += f"   📈 APY: {pool.apy:.2f}%\n"
            result += f"   📉 Variação 24h: {pool.price_change_24h:+.2f}%\n\n"
        
        return result
    
    def format_comparison_response(self, comparison: Dict, token_symbol: str, network: str) -> str:
        """Format comparison response as text"""
        if not comparison:
            return f"Nenhuma comparação disponível para {token_symbol} em {network}."
        
        result = f"⚖️ **Comparação de DEXes para {token_symbol} em {network.upper()}**\n\n"
        
        for dex, data in comparison.items():
            pool = data["best_pool"]
            result += f"**{dex.upper()}**\n"
            result += f"   🏆 Melhor Pool: {pool.token0_symbol}/{pool.token1_symbol}\n"
            result += f"   💰 TVL: ${pool.tvl:,.0f}\n"
            result += f"   📊 Volume 24h: ${pool.volume_24h:,.0f}\n"
            result += f"   📈 APY: {pool.apy:.2f}%\n"
            result += f"   🏊 Total Pools: {data['total_pools']}\n"
            result += f"   💰 TVL Total: ${data['total_tvl']:,.0f}\n\n"
        
        return result

async def main():
    """Main function to run the MCP server"""
    server = LiquidityMCPServer()
    
    # Read from stdin, write to stdout
    while True:
        try:
            line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
            if not line:
                break
            
            request = json.loads(line.strip())
            response = await server.handle_request(request)
            
            # Write response to stdout
            print(json.dumps(response), flush=True)
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
            continue
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            continue

if __name__ == "__main__":
    asyncio.run(main())
